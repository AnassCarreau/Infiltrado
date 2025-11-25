import React, { useState } from 'react';
import { Skull, Mic, AlertTriangle, Home } from 'lucide-react';
import { WORD_PACKS } from './constants/gameData'; // Importa las palabras
import { Button, Card, GameHeader, PlayerStatusList, RoleRevealButton, ChatInterface } from './components/UI';

export default function OfflineGame({ onExit }) {
  // Estado y lógica simplificada para el modo local
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

  // --- Helpers ---
  const addPlayer = () => setPlayers([...players, { id: `p${players.length+1}`, name: `Jugador ${players.length+1}`, isAlive: true }]);
  const removePlayer = () => { if(players.length > 3) setPlayers(players.slice(0, -1)); };

  const startGame = () => {
    const pack = WORD_PACKS[Math.floor(Math.random() * WORD_PACKS.length)];
    const word = pack.words[Math.floor(Math.random() * pack.words.length)];
    const impostorIndex = Math.floor(Math.random() * players.length);
    const shuffledIds = [...players].map(p => p.id).sort(() => Math.random() - 0.5);

    const resetPlayers = players.map(p => ({...p, isAlive: true}));

    setPlayers(resetPlayers);
    setGameData({ 
        ...gameData, 
        category: pack.category, 
        secretWord: word, 
        impostorId: players[impostorIndex].id, 
        turnOrder: shuffledIds, 
        chatLog: [], 
        currentPlayerReveal: 0, 
        round: 1, 
        currentTurnIndex: 0 
    });
    setGameState('ASSIGN');
    setLastEjected(null);
    setResult({ winner: null, victoryType: '' });
  };

  const handleChat = (txt) => {
    const currentPlayerId = gameData.turnOrder[gameData.currentTurnIndex];
    
    // Win Condition Chat Offline: Si el impostor acierta la palabra
    if (currentPlayerId === gameData.impostorId && txt.toLowerCase().includes(gameData.secretWord.toLowerCase())) {
        setResult({ winner: 'IMPOSTOR', victoryType: 'Palabra Acertada' });
        setGameState('RESULTS'); 
        return;
    }

    const newLog = [...gameData.chatLog, { playerId: currentPlayerId, text: txt }];
    
    // Turn Logic Offline (Buscar el siguiente vivo)
    let nextIdx = gameData.currentTurnIndex + 1;
    let nextState = gameState;
    let loopCount = 0;
    
    while(loopCount < gameData.turnOrder.length) {
        if (nextIdx >= gameData.turnOrder.length) { 
            nextIdx = 0; 
            if(!result.winner) nextState = 'VOTING'; 
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

  const handleVote = (votedId) => {
    // Si se selecciona un jugador para expulsar (en el modo simplificado offline)
    
    if (votedId === 'SKIP') {
        // Empate o Skip -> Siguiente ronda
        setGameData(p => ({ ...p, round: p.round + 1, currentTurnIndex: 0 }));
        setGameState('PLAYING');
        setVotes({});
        setLastEjected(null);
        return;
    }
    
    const ejected = players.find(p => p.id === votedId);
    setLastEjected(ejected);

    // 1. Infiltrado Expulsado
    if (votedId === gameData.impostorId) {
        setResult({ winner: 'CITIZENS', victoryType: 'Infiltrado Descubierto' });
        setGameState('RESULTS');
    } else {
        // 2. Inocente Expulsado
        const newPlayers = players.map(p => p.id === votedId ? {...p, isAlive: false} : p);
        setPlayers(newPlayers);
        
        const impAlive = newPlayers.filter(p => p.isAlive && p.id === gameData.impostorId).length;
        const citAlive = newPlayers.filter(p => p.isAlive && p.id !== gameData.impostorId).length;

        // 3. Condición Matemática
        if (impAlive >= citAlive) {
            setResult({ winner: 'IMPOSTOR', victoryType: 'Dominio Numérico' });
            setGameState('RESULTS');
        } else {
            // Continuar el juego
            setGameData(p => ({ ...p, round: p.round + 1, currentTurnIndex: 0 }));
            setGameState('PLAYING');
            setVotes({});
        }
    }
  };

  // --- RENDERIZADO ---

  if (gameState === 'LOBBY') return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <button onClick={onExit} className="absolute top-4 left-4 text-white flex gap-2"><Home/> Salir</button>
        <Card>
            <h2 className="text-2xl font-bold text-center mb-4">MODO LOCAL</h2>
            <div className="bg-gray-100 p-4 rounded mb-4 max-h-40 overflow-y-auto">
                <p className="text-xs font-bold text-gray-500 mb-1">Jugadores ({players.length}):</p>
                {players.map(p => <div key={p.id} className="border-b py-1 text-gray-800 font-medium">{p.name}</div>)}
            </div>
            <div className="flex gap-2 mb-4">
                <Button onClick={addPlayer} variant="secondary" className="text-xs">+ JUGADOR</Button>
                <Button onClick={removePlayer} variant="danger" className="text-xs" disabled={players.length<=3}>- JUGADOR</Button>
            </div>
            <div className="flex bg-gray-200 p-1 rounded-lg mb-4">
               <button onClick={() => setGameMode('FREE')} className={`flex-1 py-1 text-xs font-bold rounded ${gameMode==='FREE'?'bg-white shadow':''}`}>VOZ</button>
               <button onClick={() => setGameMode('CHAT')} className={`flex-1 py-1 text-xs font-bold rounded ${gameMode==='CHAT'?'bg-white shadow':''}`}>CHAT</button>
            </div>
            <Button onClick={startGame} disabled={players.length < 3}>INICIAR LOCAL</Button>
        </Card>
    </div>
  );
  
  if (gameState === 'ASSIGN') return (
     <div className="min-h-screen bg-slate-900 p-6 flex flex-col items-center justify-center text-center">
        <h2 className="text-gray-400 mb-2">Pásale el dispositivo a:</h2>
        <h1 className="text-4xl text-white font-bold mb-8">{players[gameData.currentPlayerReveal].name}</h1>
        <RoleRevealButton 
            isImpostor={players[gameData.currentPlayerReveal].id === gameData.impostorId} 
            word={gameData.secretWord} 
            category={gameData.category}
        />
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
                    Infiltrado Acertó (Ganar Manual)
                 </button>
            </div>
         )}
      </div>
  );

  if (gameState === 'VOTING') return (
    <div className="min-h-screen bg-indigo-900 p-4 flex flex-col items-center justify-center">
        <h2 className="text-white text-2xl font-bold mb-4">Votación Local</h2>
        <div className="text-white mb-4 text-sm text-center">Discutid y elegid a quién expulsar:</div>
        <div className="grid grid-cols-2 gap-2 w-full max-w-md">
             {players.filter(p => p.isAlive).map(p => (
                 <button key={p.id} onClick={() => handleVote(p.id)} className="bg-red-500 text-white p-3 rounded font-bold">EXPULSAR A {p.name.toUpperCase()}</button>
             ))}
             <button onClick={() => handleVote('SKIP')} className="bg-gray-500 text-white p-3 rounded font-bold col-span-2">NADIE (SKIP)</button>
        </div>
    </div>
  );

  if (gameState === 'RESULTS') return (
      <ResultsScreen 
          winner={result.winner} 
          impostorName={players.find(p => p.id === gameData.impostorId)?.name || "Infiltrado"} 
          word={gameData.secretWord} 
          victoryType={result.victoryType} 
          onReset={() => setGameState('LOBBY')}
      />
  );
}