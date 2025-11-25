import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, setDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { db, APP_ID } from '../config/firebase';
import { WORD_PACKS } from '../constants/gameData';

// --- REFERENCIAS HELPER ---
const getRoomRef = (code) => doc(db, 'artifacts', APP_ID, 'public', 'data', 'rooms', `room_${code.toUpperCase()}`);

export const useOnlineGame = (user) => {
  const [roomData, setRoomData] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [uiState, setUiState] = useState('LANDING');

  // --- LISTENER (Sincronización Tiempo Real) ---
  useEffect(() => {
    if (!user || !roomCode || uiState === 'LANDING') return;
    
    const roomRef = getRoomRef(roomCode);
    
    const unsubscribe = onSnapshot(roomRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRoomData(data);
        if (data.status !== 'LOBBY' && uiState === 'LOBBY') setUiState('GAME');
        if (data.status === 'LOBBY' && uiState === 'GAME') setUiState('LOBBY'); // Volver al lobby si el host resetea
      } else {
        setErrorMsg("Sala cerrada o no existe.");
        setUiState('LANDING');
        setRoomCode('');
      }
    });
    return () => unsubscribe();
  }, [user, roomCode, uiState]);

  // --- ACCIONES DE DB ---
  const updateRoom = async (data) => {
    if (roomCode) await updateDoc(getRoomRef(roomCode), data);
  };
  
  const createRoom = async (nickname) => {
    if (!nickname) return setErrorMsg("Pon tu nombre");
    if (!user) return setErrorMsg("Conectando...");
    
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    try {
      await setDoc(getRoomRef(code), {
        code, hostId: user.uid, status: 'LOBBY', mode: 'FREE',
        players: [{ id: user.uid, name: nickname, isAlive: true }],
        gameData: { chatLog: [], round: 1, turnOrder: [], currentTurnIndex: 0 },
        votes: {}, victoryType: '', lastEjected: null, createdAt: new Date().toISOString()
      });
      setRoomCode(code);
      setUiState('LOBBY');
    } catch (e) { setErrorMsg("Error creando sala"); }
  };

  const joinRoom = async (code, nickname) => {
    if (!nickname) return setErrorMsg("Pon tu nombre");
    if (!user) return setErrorMsg("Conectando...");
    
    const ref = getRoomRef(code);
    const snap = await getDoc(ref);
    if (!snap.exists()) return setErrorMsg("Sala no encontrada");
    
    const data = snap.data();
    if (data.status !== 'LOBBY' && !data.players.find(p=>p.id===user.uid)) return setErrorMsg("Partida ya iniciada");

    if (!data.players.find(p => p.id === user.uid)) {
      await updateDoc(ref, { players: arrayUnion({ id: user.uid, name: nickname, isAlive: true }) });
    }
    setRoomCode(code.toUpperCase());
    setUiState('LOBBY');
  };

  // --- LÓGICA DE JUEGO ---
  const startGame = async () => {
    if (!roomData || roomData.players.length < 3) return;
    const pack = WORD_PACKS[Math.floor(Math.random() * WORD_PACKS.length)];
    const word = pack.words[Math.floor(Math.random() * pack.words.length)];
    const impIdx = Math.floor(Math.random() * roomData.players.length);
    const resetPlayers = roomData.players.map(p => ({...p, isAlive: true}));
    const shuffled = [...resetPlayers].map(p => p.id).sort(() => Math.random() - 0.5);
    
    await updateDoc(getRoomRef(roomCode), {
      status: 'ASSIGN', winner: null, victoryType: '', lastEjected: null, votes: {}, players: resetPlayers,
      gameData: { category: pack.category, secretWord: word, impostorId: resetPlayers[impIdx].id, round: 1, turnOrder: shuffled, currentTurnIndex: 0, chatLog: [] }
    });
  };

  const submitChat = async (text, playerId) => {
    const { gameData, players } = roomData;
    const isImp = playerId === gameData.impostorId;
    const secretWord = gameData.secretWord;
    let winner = null;
    let victoryType = '';
    let status = roomData.status;

    // REGLA GDD: Victoria automática si Impostor acierta la palabra (Modo Chat)
    if (isImp && text.toLowerCase().includes(secretWord.toLowerCase())) {
      winner = 'IMPOSTOR';
      victoryType = 'Palabra Acertada por Infiltrado';
      status = 'RESULTS';
    }
    
    const newLog = [...gameData.chatLog, { playerId, text, round: gameData.round }];
    let nextIdx = gameData.currentTurnIndex + 1;
    let loopCount = 0;
    
    // Buscar el siguiente jugador vivo
    while (loopCount < gameData.turnOrder.length) {
       if (nextIdx >= gameData.turnOrder.length) {
          nextIdx = 0;
          if (!winner) status = 'VOTING'; // Fin de la ronda, vamos a votar
          break;
       }
       
       const nextPlayerId = gameData.turnOrder[nextIdx];
       if (players.find(p => p.id === nextPlayerId)?.isAlive) break;
       
       nextIdx++;
       loopCount++;
    }

    await updateRoom({
      'gameData.chatLog': newLog, 'gameData.currentTurnIndex': nextIdx, status,
      winner: winner || roomData.winner, victoryType: victoryType || roomData.victoryType
    });
  };

  const handleVoting = async () => {
    const counts = {};
    Object.values(roomData.votes).forEach(id => counts[id] = (counts[id] || 0) + 1);
    let max = 0, mostVoted = null, isTie = false;
    Object.entries(counts).forEach(([id, c]) => { if(c>max){max=c;mostVoted=id;isTie=false}else if(c===max)isTie=true; });

    // Empate o Skip -> Siguiente ronda
    if (!mostVoted || isTie) {
      await updateRoom({ 'gameData.round': roomData.gameData.round + 1, 'gameData.currentTurnIndex': 0, status: 'PLAYING', votes: {}, lastEjected: null });
      return;
    }

    const ejected = roomData.players.find(p => p.id === mostVoted);

    // Infiltrado Expulsado -> Ganan Ciudadanos
    if (mostVoted === roomData.gameData.impostorId) {
      await updateRoom({ winner: 'CITIZENS', status: 'RESULTS', victoryType: 'Infiltrado Descubierto', lastEjected: ejected });
      return;
    }

    // Inocente Expulsado -> Bucle de Desgaste
    const updatedPlayers = roomData.players.map(p => p.id === mostVoted ? {...p, isAlive: false} : p);
    const activeImp = updatedPlayers.filter(p => p.isAlive && p.id === roomData.gameData.impostorId).length;
    const activeCit = updatedPlayers.filter(p => p.isAlive && p.id !== roomData.gameData.impostorId).length;

    // Condición Matemática GDD: Impostores >= Ciudadanos
    if (activeImp >= activeCit) {
      await updateRoom({ players: updatedPlayers, winner: 'IMPOSTOR', status: 'RESULTS', victoryType: 'Dominio Numérico', lastEjected: ejected });
    } else {
      // Continuar el juego con el inocente muerto
      await updateRoom({ players: updatedPlayers, 'gameData.round': roomData.gameData.round + 1, 'gameData.currentTurnIndex': 0, status: 'PLAYING', votes: {}, lastEjected: ejected });
    }
  };

  return { roomData, roomCode, errorMsg, uiState, createRoom, joinRoom, startGame, updateRoom, handleVoting, submitChat };
};