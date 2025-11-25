import React, { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { auth } from './config/firebase';
import { useOnlineGame } from './hooks/useOnlineGame';

// Importa todas las pantallas
import LandingScreen from './screens/LandingScreen';
import LobbyScreen from './screens/LobbyScreen';
import AssignScreen from './screens/AssignScreen';
import PlayingScreen from './screens/PlayingScreen';
import VotingScreen from './screens/VotingScreen.jsx';
import ResultsScreen from './screens/ResultsScreen';

export default function OnlineGame({ onExit }) {
  const [user, setUser] = useState(null);

  // 1. Auth: Establecer el usuario anónimo
  useEffect(() => {
    signInAnonymously(auth);
    return onAuthStateChanged(auth, setUser);
  }, []);

  // 2. Lógica: Conectar el Hook de Lógica
  const gameLogic = useOnlineGame(user);
  const { roomData, uiState } = gameLogic;

  // Si no hay usuario o estamos en la fase inicial de conexión/login
  if (!user || uiState === 'LANDING') {
    return <LandingScreen user={user} gameLogic={gameLogic} onExit={onExit} />;
  }
  
  // Si estamos en LOBBY pero aún cargando roomData
  if (!roomData) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-indigo-600 font-bold animate-pulse">Cargando sala...</div>;

  // --- Props comunes para todas las pantallas ---
  const commonProps = {
    roomData,
    user,
    isHost: roomData.hostId === user.uid,
    myPlayer: roomData.players.find(p => p.id === user.uid),
    updateRoom: gameLogic.updateRoom,
    startGame: gameLogic.startGame,
    handleVoting: gameLogic.handleVoting,
    submitChat: gameLogic.submitChat,
  };

  // --- ENRUTADOR DE ESTADOS ---
  switch (roomData.status) {
    case 'LOBBY':
      return <LobbyScreen {...commonProps} onExit={onExit} />;
    
    case 'ASSIGN':
      return <AssignScreen {...commonProps} />;
    
    case 'PLAYING':
      return <PlayingScreen {...commonProps} />;

    case 'VOTING':
      return <VotingScreen {...commonProps} />;

    case 'RESULTS':
      return <ResultsScreen {...commonProps} />;
      
    default:
      return <div>Estado de juego desconocido: {roomData.status}</div>;
  }
}