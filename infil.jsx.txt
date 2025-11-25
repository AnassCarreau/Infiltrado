import React, { useState, useEffect, useRef } from 'react';
import { Users, Eye, EyeOff, Timer, ArrowRight, CheckCircle, Skull, Play, RotateCcw, MessageSquare, Mic, Send, AlertTriangle, User, Copy, LogOut, Smartphone, Globe, Home } from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, arrayUnion, arrayRemove, collection } from "firebase/firestore";

// ==========================================
// 1. CONFIGURACIÓN FIREBASE
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyBO7e2pt49FpB455TL21L1Ii0atq2ncVj0",
  authDomain: "elinfiltrado-9e786.firebaseapp.com",
  projectId: "elinfiltrado-9e786",
  storageBucket: "elinfiltrado-9e786.firebasestorage.app",
  messagingSenderId: "892938536894",
  appId: "1:892938536894:web:5df35d6155622288e55bef",
  measurementId: "G-9804PQRD1N"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- DATA MOCKUP ---
const WORD_PACKS = [
  { category: "Lugares", words: ["Hospital", "Playa", "Escuela", "Biblioteca", "Aeropuerto", "Cine", "Gimnasio"] },
  { category: "Comida", words: ["Pizza", "Sushi", "Tacos", "Paella", "Hamburguesa", "Helado", "Ensalada"] },
  { category: "Animales", words: ["Perro", "Gato", "Elefante", "León", "Pingüino", "Tiburón", "Águila"] },
  { category: "Objetos", words: ["Teléfono", "Silla", "Lápiz", "Reloj", "Zapatos", "Gafas", "Llaves"] },
];

const getRoomRef = (roomCode) => {
  return doc(db, 'artifacts', APP_ID, 'public', 'data', 'rooms', `room_${roomCode.toUpperCase()}`);
};

// ==========================================
// 2. COMPONENTES UI (Design System)
// ==========================================

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-auto ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = "primary", className = "", disabled = false }) => {
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-md",
    outline: "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
  };
  return (
    <button 
      onClick={onClick} disabled={disabled}
      className={`w-full py-3 px-6 rounded-lg font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </button>
  );
};

const GameHeader = ({ category, round, aliveCount }) => (
  <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm mb-4 border-l-4 border-indigo-500">
    <div>
      <p className="text-[10px] text-gray-400 font-bold uppercase">Categoría</p>
      <p className="font-bold text-indigo-900">{category}</p>
    </div>
    <div className="text-right">
      <p className="text-[10px] text-gray-400 font-bold uppercase">Ronda {round}</p>
      <p className="font-bold text-xs text-gray-500">{aliveCount} Vivos</p>
    </div>
  </div>
);

const PlayerStatusList = ({ players, turnOrder, currentTurnIndex, mode }) => (
  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center">
    {turnOrder.map((pid, idx) => {
      const p = players.find(pl => pl.id === pid);
      if (!p) return null;
      // Ajuste visual: Si el jugador está muerto, se muestra, pero gris.
      const isDead = !p.isAlive;
      const isActive = idx === currentTurnIndex && !isDead;
      
      return (
        <div key={pid} className={`flex flex-col items-center min-w-[60px] transition-all ${isActive && mode==='CHAT' ? 'scale-110' : 'opacity-80'} ${isDead ? 'grayscale opacity-40' : ''}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-1 border-2 relative ${isActive && mode==='CHAT' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-transparent bg-gray-100 text-gray-500'}`}>
            {p.name[0]}
            {isDead && <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white"><Skull size={14}/></div>}
          </div>
          <span className="text-[10px] font-bold truncate max-w-[60px]">{p.name}</span>
        </div>
      );
    })}
  </div>
);

const RoleRevealButton = ({ isImpostor, word, category }) => {
  const [show, setShow] = useState(false);
  return (
    <button 
      onMouseDown={() => setShow(true)} onMouseUp={() => setShow(false)}
      onTouchStart={() => setShow(true)} onTouchEnd={() => setShow(false)}
      className={`w-full max-w-sm h-64 rounded-2xl flex flex-col items-center justify-center transition-all shadow-xl ${show ? (isImpostor ? 'bg-rose-600' : 'bg-emerald-600') : 'bg-slate-800'}`}
    >
      {!show ? (
        <div className="text-gray-400 animate-pulse flex flex-col items-center">
          <Eye size={48} className="mb-2"/>
          <span className="text-sm font-bold uppercase tracking-widest">Mantén para ver rol</span>
        </div> 
      ) : (
        <div className="text-white text-center animate-in zoom-in duration-200">
          <h2 className="text-3xl font-black mb-2">{isImpostor ? 'INFILTRADO' : 'CIUDADANO'}</h2>
          <div className="bg-black/20 px-6 py-3 rounded-lg backdrop-blur-sm">
            <p className="text-2xl font-bold">{isImpostor ? '???' : word}</p>
          </div>
          {!isImpostor && <p className="text-xs mt-3 opacity-75 font-mono uppercase">{category}</p>}
          {isImpostor && <p className="text-xs mt-3 opacity-75 font-mono uppercase">Tu objetivo: Pasar desapercibido</p>}
        </div>
      )}
    </button>
  );
};

const ChatInterface = ({ chatLog, players, isMyTurn, onSubmit, impostorId, myId, placeholderOverride, isDead }) => {
  const [txt, setTxt] = useState('');
  const endRef = useRef(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [chatLog]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if(txt.trim()){ onSubmit(txt); setTxt(''); }
  };

  return (
    <div className="flex flex-col h-[50vh]">
      <div className="flex-1 bg-white rounded-t-xl border p-4 overflow-y-auto space-y-3">
        {chatLog.length === 0 && <p className="text-center text-gray-300 italic mt-10">La partida ha comenzado. Esperando pistas...</p>}
        {chatLog.map((msg, i) => (
          <div key={i} className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 ml-1 mb-0.5">{players.find(p=>p.id===msg.playerId)?.name}</span>
            <div className="bg-indigo-50 text-indigo-900 px-3 py-2 rounded-xl rounded-tl-none text-sm border border-indigo-100 shadow-sm w-fit max-w-[90%]">
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={endRef}/>
      </div>
      <div className="bg-white p-3 border-t rounded-b-xl shadow-lg relative z-10">
        {isDead ? (
             <div className="bg-red-50 text-red-800 p-2 rounded text-center text-xs font-bold border border-red-100">Estás eliminado. Solo puedes observar.</div>
        ) : isMyTurn ? (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input 
              value={txt} 
              onChange={e => setTxt(e.target.value)} 
              className="flex-1 bg-gray-50 border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
              placeholder={placeholderOverride || (myId === impostorId ? "Intenta adivinar la palabra..." : "Escribe una pista...")} 
              autoFocus
            />
            <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors"><Send size={18}/></button>
          </form>
        ) : <div className="text-center text-xs text-gray-400 py-2 font-bold uppercase animate-pulse">Esperando turno...</div>}
      </div>
    </div>
  );
};

const ResultsScreen = ({ winner, impostorName, word, victoryType, onReset }) => (
  <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center transition-colors duration-500 ${winner === 'CITIZENS' ? 'bg-emerald-600' : 'bg-rose-700'}`}>
    <div className="bg-white/20 p-6 rounded-full mb-6 backdrop-blur-md shadow-xl animate-bounce">
      {winner === 'CITIZENS' ? <CheckCircle size={64} className="text-white"/> : <Skull size={64} className="text-white"/>}
    </div>
    <h1 className="text-4xl font-black text-white mb-2 tracking-tight">{winner === 'CITIZENS' ? 'VICTORIA CIUDADANA' : 'VICTORIA INFILTRADA'}</h1>
    <p className="text-white/80 font-medium mb-8 text-sm uppercase tracking-widest">{victoryType}</p>
    
    <Card className="bg-white/95 border-0 shadow-2xl text-left transform hover:scale-105 transition-transform">
      <div className="grid grid-cols-2 gap-4">
        <div className="border-r border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Infiltrado</p>
            <p className="text-xl font-bold text-rose-600 truncate">{impostorName}</p>
        </div>
        <div className="pl-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Palabra Secreta</p>
            <p className="text-xl font-bold text-emerald-600 truncate">{word}</p>
        </div>
      </div>
    </Card>
    {onReset && <div className="mt-12 w-full max-w-xs"><Button onClick={onReset} variant="secondary">Volver al Lobby</Button></div>}
  </div>
);

// ==========================================
// 3. LOGICA Y MÓDULOS DE JUEGO
// ==========================================

function OnlineGame({ onExit }) {
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [uiState, setUiState] = useState('LANDING'); // LANDING, LOBBY, GAME
  const [errorMsg, setErrorMsg] = useState('');
  const [roomData, setRoomData] = useState(null);

  // --- Auth & Listener Hooks ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user || !roomCode || uiState === 'LANDING') return;
    const roomRef = getRoomRef(roomCode);
    
    return onSnapshot(roomRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRoomData(data);
        if (data.status !== 'LOBBY' && uiState === 'LOBBY') setUiState('GAME');
      } else {
        setErrorMsg("Sala cerrada o no existe.");
        setUiState('LANDING');
        setRoomCode('');
      }
    });
  }, [user, roomCode, uiState]);

  // --- Actions ---
  const updateRoom = async (data) => {
    if (!roomCode) return;
    await updateDoc(getRoomRef(roomCode), data);
  };

  const createRoom = async () => {
    setErrorMsg('');
    if (!nickname) return setErrorMsg("Pon tu nombre");
    if (!user) return setErrorMsg("Conectando...");
    
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    try {
      await setDoc(getRoomRef(code), {
        code,
        hostId: user.uid,
        status: 'LOBBY',
        mode: 'FREE',
        players: [{ id: user.uid, name: nickname, isAlive: true }],
        gameData: { chatLog: [], round: 1, turnOrder: [], currentTurnIndex: 0 },
        votes: {},
        victoryType: '',
        createdAt: new Date().toISOString()
      });
      setRoomCode(code);
      setUiState('LOBBY');
    } catch (e) {
      console.error("Error creating room:", e);
      setErrorMsg("Error al crear sala.");
    }
  };

  const joinRoom = async (inputCode) => {
    if (!nickname) return setErrorMsg("Pon tu nombre");
    if (!user) return setErrorMsg("Conectando...");
    
    const code = inputCode.toUpperCase();
    const ref = getRoomRef(code);
    const snap = await getDoc(ref);
    
    if (!snap.exists()) return setErrorMsg("No existe esa sala");
    
    const data = snap.data();
    const isPlayer = data.players.find(p => p.id === user.uid);
    
    if (data.status !== 'LOBBY' && !isPlayer) return setErrorMsg("Partida ya iniciada");
    
    if (!isPlayer) {
      await updateDoc(ref, { 
        players: arrayUnion({ id: user.uid, name: nickname, isAlive: true }) 
      });
    }
    setRoomCode(code);
    setUiState('LOBBY');
  };

  const startGame = async () => {
    if (roomData.players.length < 3) return;
    const pack = WORD_PACKS[Math.floor(Math.random() * WORD_PACKS.length)];
    const word = pack.words[Math.floor(Math.random() * pack.words.length)];
    const impIdx = Math.floor(Math.random() * roomData.players.length);
    
    // Resetear a todos los jugadores a Vivos
    const resetPlayers = roomData.players.map(p => ({...p, isAlive: true}));
    const shuffled = [...resetPlayers].map(p => p.id).sort(() => Math.random() - 0.5);
    
    await updateRoom({
      status: 'ASSIGN',
      winner: null,
      victoryType: '',
      lastEjected: null,
      votes: {},
      players: resetPlayers,
      gameData: {
        category: pack.category,
        secretWord: word,
        impostorId: resetPlayers[impIdx].id,
        round: 1,
        turnOrder: shuffled,
        currentTurnIndex: 0,
        chatLog: []
      }
    });
  };

  // --- LÓGICA CRÍTICA DEL JUEGO (CHAT Y VICTORIA) ---
  const submitChat = async (text) => {
    const { gameData } = roomData;
    const isImp = user.uid === gameData.impostorId;
    let winner = null;
    let victoryType = '';
    let status = roomData.status;

    // 1. REGLA GDD: Victoria automática si Infiltrado escribe la palabra secreta (Modo Chat)
    // Se compara ignorando mayúsculas y espacios
    if (isImp && text.toLowerCase().includes(gameData.secretWord.toLowerCase())) {
      winner = 'IMPOSTOR';
      victoryType = 'Palabra Acertada';
      status = 'RESULTS';
    }
    
    const newLog = [...gameData.chatLog, { playerId: user.uid, text, round: gameData.round }];
    
    // Cálculo de turnos (saltar muertos)
    let nextIdx = gameData.currentTurnIndex + 1;
    let loopCount = 0;
    
    // Buscar el siguiente jugador vivo
    while (loopCount < gameData.turnOrder.length) {
       if (nextIdx >= gameData.turnOrder.length) {
          nextIdx = 0; // Vuelta al principio
          // Si hemos dado la vuelta completa y volvemos al 0, cambiamos de fase a VOTACIÓN (si nadie ganó aún)
          if (!winner) status = 'VOTING'; 
          break;
       }
       
       const nextPlayerId = gameData.turnOrder[nextIdx];
       const nextPlayer = roomData.players.find(p => p.id === nextPlayerId);
       
       if (nextPlayer && nextPlayer.isAlive) {
         break; // Encontramos al siguiente vivo
       }
       nextIdx++;
       loopCount++;
    }

    await updateRoom({
      'gameData.chatLog': newLog,
      'gameData.currentTurnIndex': nextIdx,
      status,
      winner: winner || roomData.winner,
      victoryType: victoryType || roomData.victoryType
    });
  };

  // --- LÓGICA CRÍTICA: BUCLE DE DESGASTE Y MATEMÁTICAS ---
  const handleVoting = async () => {
    const counts = {};
    Object.values(roomData.votes).forEach(id => counts[id] = (counts[id] || 0) + 1);
    
    let max = 0;
    let mostVoted = null;
    let isTie = false;

    Object.entries(counts).forEach(([id, c]) => { 
      if(c > max){ max=c; mostVoted=id; isTie=false; }
      else if (c === max) { isTie = true; }
    });
    
    // REGLA GDD: Empate o Skip -> Nadie eliminado, Siguiente Ronda
    if (!mostVoted || isTie) {
      await updateRoom({ 
        'gameData.round': roomData.gameData.round + 1, 
        'gameData.currentTurnIndex': 0, // Reiniciar turnos
        status: 'PLAYING', 
        votes: {},
        lastEjected: null 
      });
      return;
    }

    const ejected = roomData.players.find(p => p.id === mostVoted);
    
    // REGLA GDD: Si expulsan al Impostor -> Ganan Ciudadanos
    if (mostVoted === roomData.gameData.impostorId) {
      await updateRoom({ 
          winner: 'CITIZENS', 
          status: 'RESULTS', 
          victoryType: 'Infiltrado Descubierto',
          lastEjected: ejected 
      });
      return;
    }
    
    // REGLA GDD: Si expulsan Inocente -> Inocente muere, Juego CONTINÚA (Bucle de Desgaste)
    // A MENOS QUE se cumpla la condición matemática.
    const updatedPlayers = roomData.players.map(p => p.id === mostVoted ? {...p, isAlive: false} : p);
    
    // Condición Matemática: Impostores >= Ciudadanos
    const activeImpostors = updatedPlayers.filter(p => p.isAlive && p.id === roomData.gameData.impostorId).length; // Debería ser 1
    const activeCitizens = updatedPlayers.filter(p => p.isAlive && p.id !== roomData.gameData.impostorId).length;

    if (activeImpostors >= activeCitizens) {
      // VICTORIA AUTOMÁTICA IMPOSTOR
      await updateRoom({ 
          players: updatedPlayers, 
          winner: 'IMPOSTOR', 
          status: 'RESULTS', 
          victoryType: 'Dominio Numérico',
          lastEjected: ejected 
      });
    } else {
      // EL JUEGO SIGUE (Bucle)
      await updateRoom({ 
        players: updatedPlayers, 
        'gameData.round': roomData.gameData.round + 1, 
        'gameData.currentTurnIndex': 0, 
        status: 'PLAYING', 
        votes: {}, 
        lastEjected: ejected 
      });
    }
  };

  // --- RENDERS ---

  if (uiState === 'LANDING') return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 left-4"><button onClick={onExit} className="text-white flex gap-2"><Home/> Inicio</button></div>
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500 mb-6">ONLINE</h2>
      <Card>
        <div className="mb-4">
          <label className="text-xs font-bold text-gray-500">Tu Nickname</label>
          <input value={nickname} onChange={e => setNickname(e.target.value)} className="w-full p-2 border rounded font-bold uppercase" placeholder="NOMBRE..."/>
        </div>
        <Button onClick={createRoom} disabled={!user || !nickname}>{!user ? 'CONECTANDO...' : 'CREAR SALA'}</Button>
        <div className="text-center my-4 text-gray-400 text-sm">- O -</div>
        <div className="flex gap-2">
          <input value={roomCode} onChange={e => setRoomCode(e.target.value)} className="flex-1 p-2 border rounded uppercase text-center font-mono" placeholder="CÓDIGO"/>
          <Button onClick={() => joinRoom(roomCode)} variant="secondary" className="w-auto" disabled={!user || !roomCode}>ENTRAR</Button>
        </div>
        {errorMsg && <p className="text-red-500 text-center mt-2 font-bold text-sm">{errorMsg}</p>}
      </Card>
    </div>
  );

  if (!roomData) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-indigo-600 font-bold animate-pulse">Cargando sala...</div>;
  
  const isHost = roomData.hostId === user.uid;
  const myPlayer = roomData.players.find(p => p.id === user.uid);
  const isMyTurn = roomData.gameData.turnOrder[roomData.gameData.currentTurnIndex] === user.uid;

  if (roomData.status === 'LOBBY') return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6">
      <div className="w-full flex justify-between items-center mb-8">
         <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded text-xs font-bold font-mono">SALA: {roomData.code}</span>
         <button onClick={() => { updateRoom({ players: arrayRemove(myPlayer) }); onExit(); }} className="text-red-500 text-xs font-bold flex gap-1 items-center hover:bg-red-50 px-2 py-1 rounded"><LogOut size={14}/> SALIR</button>
      </div>
      <h1 className="text-6xl font-mono font-black text-indigo-600 mb-2 tracking-tighter">{roomData.code}</h1>
      <p className="text-gray-400 mb-8 text-sm font-medium">Comparte este código con tus amigos</p>
      
      {isHost ? (
        <div className="flex bg-gray-200 p-1 rounded-lg mb-8 w-full max-w-xs">
           <button onClick={() => updateRoom({mode: 'FREE'})} className={`flex-1 py-2 text-xs font-bold rounded transition-all ${roomData.mode==='FREE'?'bg-white shadow text-indigo-600':'text-gray-500'}`}>VOZ (LIBRE)</button>
           <button onClick={() => updateRoom({mode: 'CHAT'})} className={`flex-1 py-2 text-xs font-bold rounded transition-all ${roomData.mode==='CHAT'?'bg-white shadow text-indigo-600':'text-gray-500'}`}>CHAT (TURNOS)</button>
        </div>
      ) : <div className="text-xs bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full font-bold mb-8 shadow-sm border border-indigo-100">MODO: {roomData.mode === 'FREE' ? 'VOZ' : 'CHAT'}</div>}

      <div className="w-full max-w-md space-y-3 mb-8">
         {roomData.players.map(p => (
           <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 border border-gray-100">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center font-bold text-indigo-600">{p.name[0]}</div>
              <span className={`font-bold ${p.id === user.uid ? 'text-indigo-600' : 'text-gray-700'}`}>{p.name} {p.id === user.uid && '(Tú)'}</span>
              {p.id === roomData.hostId && <span className="ml-auto text-[10px] bg-yellow-100 px-2 py-1 rounded text-yellow-800 font-bold border border-yellow-200">HOST</span>}
           </div>
         ))}
      </div>
      {isHost ? (
        <Button onClick={startGame} disabled={roomData.players.length < 3} className="max-w-md shadow-xl shadow-indigo-200">
          {roomData.players.length < 3 ? `FALTAN ${3 - roomData.players.length} JUGADORES` : 'INICIAR PARTIDA'}
        </Button>
      ) : <p className="animate-pulse text-gray-400 font-medium">Esperando al anfitrión...</p>}
    </div>
  );

  if (roomData.status === 'ASSIGN') return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
       <h2 className="text-xl font-bold mb-6 text-indigo-200">Tu Identidad Secreta</h2>
       <RoleRevealButton isImpostor={user.uid === roomData.gameData.impostorId} word={roomData.gameData.secretWord} category={roomData.gameData.category} />
       {isHost ? (
         <div className="mt-10 w-full max-w-xs"><Button onClick={() => updateRoom({status: 'PLAYING'})}>EMPEZAR RONDA 1</Button></div>
       ) : <p className="mt-10 text-gray-500 text-sm animate-pulse font-mono">ESPERANDO AL HOST...</p>}
    </div>
  );

  if (roomData.status === 'RESULTS') return (
    <ResultsScreen 
      winner={roomData.winner} 
      impostorName={roomData.players.find(p=>p.id===roomData.gameData.impostorId)?.name} 
      word={roomData.gameData.secretWord} 
      victoryType={roomData.victoryType}
      onReset={isHost ? () => updateRoom({status: 'LOBBY', votes: {}, winner: null, lastEjected: null, victoryType: ''}) : null} 
    />
  );

  if (roomData.status === 'VOTING') return (
    <div className="min-h-screen bg-indigo-900 p-6 flex flex-col items-center justify-center relative overflow-hidden">
       {/* Fondo decorativo */}
       <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
       
       <h2 className="text-white text-3xl font-black mb-2 z-10">¿QUIÉN ES EL INFILTRADO?</h2>
       <p className="text-indigo-300 mb-8 z-10">Vota para expulsar</p>
       
       {!myPlayer.isAlive ? <div className="bg-indigo-800/50 p-4 rounded-xl text-indigo-200 mb-4 z-10 border border-indigo-700">Has sido eliminado. No puedes votar.</div> : (
         <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8 z-10">
            {roomData.players.filter(p => p.isAlive).map(p => {
               const selected = roomData.votes[user.uid] === p.id;
               return (
                 <button key={p.id} onClick={() => updateRoom({ [`votes.${user.uid}`]: p.id })} 
                    className={`p-4 rounded-xl font-bold transition-all border-2 ${selected ? 'bg-white text-indigo-900 border-white scale-105 shadow-lg' : 'bg-indigo-800/50 text-indigo-100 border-indigo-700 hover:bg-indigo-800'}`}>
                    {p.name}
                 </button>
               )
            })}
         </div>
       )}
       
       <div className="z-10 w-full max-w-md">
           {isHost && <Button onClick={handleVoting} disabled={Object.keys(roomData.votes).length < roomData.players.filter(p=>p.isAlive).length}>CERRAR VOTACIÓN</Button>}
           {!isHost && <p className="text-indigo-300 animate-pulse mt-4 text-center font-bold">ESPERANDO RESULTADOS...</p>}
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 flex flex-col">
       {roomData.lastEjected && (
           <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-4 rounded shadow-sm" role="alert">
                <p className="font-bold">Resultados Votación</p>
                <p>{roomData.lastEjected.name} fue expulsado.</p>
                <p className="text-sm mt-1">Era <span className="font-black">INOCENTE</span>.</p>
           </div>
       )}

       <GameHeader category={roomData.gameData.category} round={roomData.gameData.round} aliveCount={roomData.players.filter(p=>p.isAlive).length} />
       
       <div className="mb-4">
            <PlayerStatusList players={roomData.players} turnOrder={roomData.gameData.turnOrder} currentTurnIndex={roomData.gameData.currentTurnIndex} mode={roomData.mode} />
       </div>
       
       {roomData.mode === 'CHAT' ? (
          <ChatInterface 
             chatLog={roomData.gameData.chatLog} players={roomData.players}
             isMyTurn={isMyTurn} onSubmit={submitChat} 
             impostorId={roomData.gameData.impostorId} myId={user.uid}
             isDead={!myPlayer.isAlive}
          />
       ) : (
          <div className="bg-white p-8 rounded-2xl shadow-lg mt-4 text-center flex-1 flex flex-col justify-center items-center border border-indigo-50">
             <div className="bg-blue-100 p-6 rounded-full mb-6 animate-pulse">
                <Mic size={48} className="text-blue-600"/>
             </div>
             <h3 className="text-2xl font-bold text-gray-800 mb-2">Debate de Voz</h3>
             <p className="text-gray-500 mb-8">Discutid libremente quién es el infiltrado.</p>
             
             {isHost ? <Button onClick={() => updateRoom({status: 'VOTING'})}>IR A VOTACIÓN</Button> : <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Esperando al Host...</p>}
             
             {/* REGLA GDD: Botón manual para Modo Voz */}
             {myPlayer.isAlive && user.uid !== roomData.gameData.impostorId && (
                 <button 
                    onClick={() => updateRoom({winner: 'IMPOSTOR', status: 'RESULTS', victoryType: 'Reconocido por Ciudadano'})} 
                    className="mt-8 text-rose-500 text-xs font-bold border border-rose-200 px-4 py-2 rounded-full hover:bg-rose-50 transition-colors flex items-center gap-2">
                    <AlertTriangle size={14}/> ¡HE OÍDO LA PALABRA! (Gana Infiltrado)
                 </button>
             )}
          </div>
       )}
    </div>
  );
}

// ==========================================
// 4. MÓDULO OFFLINE (SIMPLIFICADO)
// ==========================================

function OfflineGame({ onExit }) {
  const [gameState, setGameState] = useState('LOBBY'); 
  const [gameMode, setGameMode] = useState('FREE'); 
  const [players, setPlayers] = useState([
      { id: 'p1', name: 'Jugador 1', isAlive: true }, 
      { id: 'p2', name: 'Jugador 2', isAlive: true }, 
      { id: 'p3', name: 'Jugador 3', isAlive: true }
  ]);
  const [gameData, setGameData] = useState({ category: '', secretWord: '', impostorId: null, round: 1, turnOrder: [], currentTurnIndex: 0, chatLog: [], currentPlayerReveal: 0 });
  const [votes, setVotes] = useState({});
  const [lastEjected, setLastEjected] = useState(null);
  const [result, setResult] = useState({ winner: null, victoryType: '' });

  // Helpers para Offline
  const addPlayer = () => setPlayers([...players, { id: `p${players.length+1}`, name: `Jugador ${players.length+1}`, isAlive: true }]);
  const removePlayer = () => { if(players.length > 3) setPlayers(players.slice(0, -1)); };

  const startGame = () => {
    const pack = WORD_PACKS[Math.floor(Math.random() * WORD_PACKS.length)];
    const word = pack.words[Math.floor(Math.random() * pack.words.length)];
    const impostorIndex = Math.floor(Math.random() * players.length);
    const shuffledIds = [...players].map(p => p.id).sort(() => Math.random() - 0.5);

    // Resetear Vivos
    const resetPlayers = players.map(p => ({...p, isAlive: true}));

    setPlayers(resetPlayers);
    setGameData({ ...gameData, category: pack.category, secretWord: word, impostorId: players[impostorIndex].id, turnOrder: shuffledIds, chatLog: [], currentPlayerReveal: 0, round: 1, currentTurnIndex: 0 });
    setGameState('ASSIGN');
    setLastEjected(null);
  };

  const handleChat = (txt) => {
    const currentPlayerId = gameData.turnOrder[gameData.currentTurnIndex];
    
    // Win Condition Chat Offline
    if (currentPlayerId === gameData.impostorId && txt.toLowerCase().includes(gameData.secretWord.toLowerCase())) {
        setResult({ winner: 'IMPOSTOR', victoryType: 'Palabra Acertada' });
        setGameState('RESULTS'); 
        return;
    }

    const newLog = [...gameData.chatLog, { playerId: currentPlayerId, text: txt }];
    
    // Turn Logic Offline
    let nextIdx = gameData.currentTurnIndex + 1;
    let nextState = gameState;
    let loopCount = 0;
    
    // Buscar vivo
    while(loopCount < gameData.turnOrder.length) {
        if (nextIdx >= gameData.turnOrder.length) { 
            nextIdx = 0; 
            if(!result.winner) nextState = 'VOTING'; // Fin de ronda
            break;
        }
        const pId = gameData.turnOrder[nextIdx];
        if(players.find(p => p.id === pId)?.isAlive) break;
        nextIdx++;
        loopCount++;
    }

    setGameData(p => ({...p, chatLog: newLog, currentTurnIndex: nextIdx}));
    if (nextState === 'VOTING') setGameState('VOTING');
  };

  const handleVote = () => {
    const counts = {};
    Object.values(votes).forEach(id => counts[id] = (counts[id] || 0) + 1);
    let max = 0, mostVoted = null, isTie = false;
    Object.entries(counts).forEach(([id, c]) => { if(c > max){ max=c; mostVoted=id; isTie=false; } else if(c===max) isTie=true; });

    if (!mostVoted || isTie) {
        setGameData(p => ({ ...p, round: p.round + 1, currentTurnIndex: 0 }));
        setGameState('PLAYING');
        setVotes({});
        return;
    }

    const ejected = players.find(p => p.id === mostVoted);
    setLastEjected(ejected);

    if (mostVoted === gameData.impostorId) {
        setResult({ winner: 'CITIZENS', victoryType: 'Infiltrado Descubierto' });
        setGameState('RESULTS');
    } else {
        const newPlayers = players.map(p => p.id === mostVoted ? {...p, isAlive: false} : p);
        setPlayers(newPlayers);
        
        const impAlive = newPlayers.filter(p => p.isAlive && p.id === gameData.impostorId).length;
        const citAlive = newPlayers.filter(p => p.isAlive && p.id !== gameData.impostorId).length;

        if (impAlive >= citAlive) {
            setResult({ winner: 'IMPOSTOR', victoryType: 'Dominio Numérico' });
            setGameState('RESULTS');
        } else {
            setGameData(p => ({ ...p, round: p.round + 1, currentTurnIndex: 0 }));
            setGameState('PLAYING');
            setVotes({});
        }
    }
  };

  // Render simplificado Offline
  if (gameState === 'LOBBY') return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <button onClick={onExit} className="self-start text-white mb-4 flex gap-2"><Home/> Salir</button>
        <Card>
            <h2 className="text-2xl font-bold text-center mb-4">MODO LOCAL</h2>
            <div className="bg-gray-100 p-4 rounded mb-4 max-h-40 overflow-y-auto">
                {players.map(p => <div key={p.id} className="border-b py-1">{p.name}</div>)}
            </div>
            <div className="flex gap-2 mb-4">
                <Button onClick={addPlayer} variant="secondary" className="text-xs">+ JUGADOR</Button>
                <Button onClick={removePlayer} variant="danger" className="text-xs" disabled={players.length<=3}>- JUGADOR</Button>
            </div>
            <div className="flex bg-gray-200 p-1 rounded-lg mb-4">
               <button onClick={() => setGameMode('FREE')} className={`flex-1 py-1 text-xs font-bold rounded ${gameMode==='FREE'?'bg-white shadow':''}`}>VOZ</button>
               <button onClick={() => setGameMode('CHAT')} className={`flex-1 py-1 text-xs font-bold rounded ${gameMode==='CHAT'?'bg-white shadow':''}`}>CHAT</button>
            </div>
            <Button onClick={startGame}>JUGAR</Button>
        </Card>
    </div>
  );
  
  if (gameState === 'ASSIGN') return (
     <div className="min-h-screen bg-slate-900 p-6 flex flex-col items-center justify-center text-center">
        <h2 className="text-gray-400 mb-2">Pásale el dispositivo a:</h2>
        <h1 className="text-4xl text-white font-bold mb-8">{players[gameData.currentPlayerReveal].name}</h1>
        <RoleRevealButton isImpostor={players[gameData.currentPlayerReveal].id === gameData.impostorId} word={gameData.secretWord} category={gameData.category}/>
        <div className="mt-8 w-full max-w-md">
            <Button onClick={() => {
                if (gameData.currentPlayerReveal < players.length - 1) setGameData(prev => ({...prev, currentPlayerReveal: prev.currentPlayerReveal+1}));
                else setGameState('PLAYING');
            }}>
                {gameData.currentPlayerReveal === players.length - 1 ? 'Empezar Juego' : 'Siguiente Jugador'}
            </Button>
        </div>
     </div>
  );

  if (gameState === 'PLAYING') return (
      <div className="min-h-screen bg-slate-50 p-4 flex flex-col">
         {lastEjected && <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-2 mb-2 rounded text-sm text-center"><b>{lastEjected.name}</b> era INOCENTE.</div>}
         <GameHeader category={gameData.category} round={gameData.round} aliveCount={players.filter(p=>p.isAlive).length} />
         <PlayerStatusList players={players} turnOrder={gameData.turnOrder} currentTurnIndex={gameData.currentTurnIndex} mode={gameMode}/>
         
         {gameMode === 'CHAT' ? (
             <ChatInterface 
                chatLog={gameData.chatLog} players={players} isMyTurn={true} onSubmit={handleChat} 
                impostorId={gameData.impostorId} myId={null} 
                placeholderOverride={`Escribe como ${players.find(p=>p.id===gameData.turnOrder[gameData.currentTurnIndex])?.name}...`}
                isDead={false}
             />
         ) : (
            <div className="bg-white p-8 rounded-2xl shadow mt-4 text-center flex-1 flex flex-col justify-center">
                <p className="text-2xl font-bold mb-4">Debate de Voz</p>
                <Button onClick={() => setGameState('VOTING')}>Ir a Votar</Button>
                <button 
                    onClick={() => { setResult({winner: 'IMPOSTOR', victoryType: 'Manual'}); setGameState('RESULTS'); }}
                    className="mt-8 text-rose-500 text-xs font-bold border border-rose-200 px-4 py-2 rounded-full self-center">
                    Infiltrado Acertó (Ganar)
                 </button>
            </div>
         )}
      </div>
  );

  if (gameState === 'VOTING') return (
    <div className="min-h-screen bg-indigo-900 p-4 flex flex-col items-center justify-center">
        <h2 className="text-white text-2xl font-bold mb-4">Votación (Pasar Dispositivo)</h2>
        <div className="grid grid-cols-2 gap-3 w-full max-w-md mb-8">
            {players.filter(p => p.isAlive).map(p => (
                <button key={p.id} onClick={() => setVotes(prev => ({...prev, [p.id]: (prev[p.id] || 0) ? undefined : p.id}))} // Simulación simple visual
                   className={`p-4 rounded-lg font-bold bg-indigo-800 text-indigo-200 pointer-events-none`}>
                   {p.name}
                </button>
            ))}
        </div>
        <div className="text-white mb-4 text-sm text-center">En modo offline, discutid y decidid verbalmente quién se va, luego pulsa abajo el nombre del expulsado:</div>
        <div className="grid grid-cols-3 gap-2 w-full max-w-md">
             {players.filter(p => p.isAlive).map(p => (
                 <button key={p.id} onClick={() => { setVotes({['decision']: p.id}); setTimeout(handleVote, 100); }} className="bg-red-500 text-white p-2 rounded text-xs font-bold">EXPULSAR A {p.name.toUpperCase()}</button>
             ))}
             <button onClick={() => { setVotes({}); setTimeout(handleVote, 100); }} className="bg-gray-500 text-white p-2 rounded text-xs font-bold">NADIE (SKIP)</button>
        </div>
    </div>
  );

  if (gameState === 'RESULTS') return <ResultsScreen winner={result.winner} impostorName="Infiltrado" word={gameData.secretWord} victoryType={result.victoryType} onReset={() => setGameState('LOBBY')}/>;
  
  return <div className="p-10 text-center">Cargando...</div>;
}

// ==========================================
// 5. MAIN APP
// ==========================================

export default function App() {
  const [appMode, setAppMode] = useState(null);

  if (appMode === 'OFFLINE') return <OfflineGame onExit={() => setAppMode(null)} />;
  if (appMode === 'ONLINE') return <OnlineGame onExit={() => setAppMode(null)} />;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="relative z-10 text-center w-full max-w-md">
        <div className="mb-8 flex justify-center">
            <div className="bg-white/10 p-4 rounded-full backdrop-blur-sm">
                <Users size={48} className="text-white" />
            </div>
        </div>
        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 mb-2 tracking-tighter">EL INFILTRADO</h1>
        <p className="text-indigo-200 mb-12 text-lg font-medium">Engaña. Deduce. Sobrevive.</p>
        
        <div className="space-y-4">
          <button onClick={() => setAppMode('OFFLINE')} className="w-full bg-white hover:bg-indigo-50 text-slate-900 p-6 rounded-2xl shadow-xl flex items-center justify-between group transition-all active:scale-95">
             <div className="flex items-center gap-4">
                <div className="bg-indigo-100 p-3 rounded-full text-indigo-600"><Smartphone size={32} /></div>
                <div className="text-left"><h3 className="font-bold text-xl">Modo Local</h3><p className="text-gray-500 text-sm">1 Dispositivo • Pasando el móvil</p></div>
             </div>
             <ArrowRight className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
          </button>
          
          <button onClick={() => setAppMode('ONLINE')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-2xl shadow-xl flex items-center justify-between group border border-indigo-500 transition-all active:scale-95">
             <div className="flex items-center gap-4">
                <div className="bg-indigo-800 p-3 rounded-full text-indigo-200"><Globe size={32} /></div>
                <div className="text-left"><h3 className="font-bold text-xl">Modo Online</h3><p className="text-indigo-200 text-sm">Multijugador • Tiempo Real</p></div>
             </div>
             <ArrowRight className="text-indigo-400 group-hover:text-white transition-colors" />
          </button>
        </div>
        
        <p className="mt-12 text-gray-600 text-xs font-mono">v2.0.0 Refactored • GDD Compliant</p>
      </div>
    </div>
  );
}