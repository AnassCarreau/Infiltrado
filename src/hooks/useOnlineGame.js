// src/hooks/useOnlineGame.js
// ... imports previos ...
import { calculateNextTurn, checkWinCondition, generateInitialState } from '../utils/gameRules';
// ... código de conexión Firebase (getRoomRef, listeners) se mantiene igual ...

// DENTRO DE LA FUNCIÓN useOnlineGame, REEMPLAZA LOS MÉTODOS DE LÓGICA:

  // --- 3. LÓGICA DE JUEGO OPTIMIZADA ---
  
  const startGame = async () => {
    if (!roomData || roomData.players.length < 3) return setErrorMsg("Mínimo 3 jugadores");
    
    // Usamos el generador puro
    const initialState = generateInitialState(roomData.players, WORD_PACKS);
    
    // Añadimos datos específicos de Firebase (como resetear isAlive en DB)
    const resetPlayers = roomData.players.map(p => ({...p, isAlive: true}));
    
    await updateDoc(getRoomRef(roomCode), {
      status: 'ASSIGN',
      winner: null,
      victoryType: '',
      lastEjected: null,
      votes: {},
      players: resetPlayers,
      gameData: initialState // Insertamos el objeto generado
    });
  };

  const submitChat = async (text, playerId) => {
    const { gameData, players } = roomData;
    
    // 1. Verificación Inmediata (Win condition)
    if (playerId === gameData.impostorId && text.toLowerCase().includes(gameData.secretWord.toLowerCase())) {
        await updateRoom({
            status: 'RESULTS',
            winner: 'IMPOSTOR',
            victoryType: 'Palabra Acertada por Infiltrado'
        });
        return;
    }

    // 2. Cálculo de Turno (Lógica Pura)
    const nextIdx = calculateNextTurn(gameData.currentTurnIndex, gameData.turnOrder, players);
    const newLog = [...gameData.chatLog, { playerId, text, round: gameData.round }];

    // 3. Determinar si cambia de fase (Si el turno vuelve al inicio o algo similar)
    // NOTA: Aquí puedes decidir si al acabar la ronda pasas a VOTING automáticamente
    // En el modo simple, solo pasamos turno.
    
    let nextStatus = roomData.status;
    // Ejemplo: Si nextIdx es menor que el actual, asumimos nueva ronda -> Votación
    if (nextIdx < gameData.currentTurnIndex) {
         nextStatus = 'VOTING';
    }

    await updateRoom({
        'gameData.chatLog': newLog,
        'gameData.currentTurnIndex': nextIdx,
        status: nextStatus
    });
  };

  const handleVoting = async () => {
    // ... (lógica de conteo de votos igual que antes) ...
    // Supongamos que tenemos 'mostVoted' (id del expulsado)

    if (!mostVoted || isTie) {
        // Skip
        await updateRoom({ 
            'gameData.round': roomData.gameData.round + 1, 
            status: 'PLAYING', votes: {}, lastEjected: null 
        });
        return;
    }

    // Actualizar muertes
    const updatedPlayers = roomData.players.map(p => p.id === mostVoted ? {...p, isAlive: false} : p);
    const ejectedPlayer = roomData.players.find(p => p.id === mostVoted);

    // Usar el validador puro de victoria
    const winResult = checkWinCondition(updatedPlayers, roomData.gameData.impostorId, mostVoted);

    if (winResult) {
        await updateRoom({
            players: updatedPlayers,
            winner: winResult.winner,
            victoryType: winResult.victoryType,
            status: 'RESULTS',
            lastEjected: ejectedPlayer
        });
    } else {
        await updateRoom({
            players: updatedPlayers,
            'gameData.round': roomData.gameData.round + 1,
            'gameData.currentTurnIndex': 0, // Reset turno
            status: 'PLAYING',
            votes: {},
            lastEjected: ejectedPlayer
        });
    }
  };