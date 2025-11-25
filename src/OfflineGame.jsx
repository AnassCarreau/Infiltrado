import React from 'react';
import { useOfflineGame } from './hooks/useOfflineGame'; // Tu nuevo hook optimizado
// Importamos LAS MISMAS pantallas que usa el modo Online
import LobbyScreen from './screens/LobbyScreen';
import AssignScreen from './screens/AssignScreen';
import PlayingScreen from './screens/PlayingScreen';
import VotingScreen from './screens/VotingScreen';
import ResultsScreen from './screens/ResultsScreen';

export default function OfflineGame({ onExit }) {
  const { 
      players, gameState, 
      addPlayer, removePlayer, startGame, nextReveal, 
      submitChat, handleVote, resetGame, setMode 
  } = useOfflineGame();

  // --- ADAPTADOR ---
  // Convertimos el estado local a la estructura que esperan las pantallas
  const roomDataAdapated = {
      code: 'CX-LOCAL', // Código falso para mostrar en UI
      hostId: 'local-admin', // Simulamos que somos el host
      status: gameState.status,
      mode: gameState.mode,
      players: players,
      gameData: gameState.gameData,
      votes: {}, // Opcional: pasar votos locales si los guardas en gameState
      winner: gameState.result.winner,
      victoryType: gameState.result.victoryType,
      lastEjected: gameState.lastEjected
  };

  const userMock = { uid: 'local-admin' }; // Usuario ficticio para engañar a las pantallas
  
  // Props comunes que inyectaremos a las pantallas
  const commonProps = {
      roomData: roomDataAdapated,
      user: userMock,
      isHost: true, // En local siempre eres el host
      myPlayer: players[0], // O el jugador actual del turno
      updateRoom: (updates) => {
          // Aquí mapeamos las acciones de las pantallas a funciones del hook Offline
          if (updates.status === 'LOBBY') resetGame();
          if (updates.status === 'VOTING') {/* manejar cambio fase */}
          if (updates.mode) setMode(updates.mode);
          // etc...
      },
      // Mapeamos funciones específicas
      startGame: startGame,
      handleVoting: () => {}, // En local el voto es inmediato, quizás no necesites "Cerrar votación" global
      submitChat: (text) => submitChat(text),
  };

  // --- RENDERIZADO UNIFICADO ---
  switch (gameState.status) {
      case 'LOBBY':
          // Pasamos funciones extra que LobbyScreen pueda necesitar
          return <LobbyScreen {...commonProps} onExit={onExit} />;
      
      case 'ASSIGN':
           // AssignScreen espera 'RoleRevealButton', pero en Offline tienes lógica de "Pasa el móvil".
           // Aquí quizás sea el único sitio donde quieras mantener una UI personalizada o adaptar AssignScreen.
           return (
               <AssignScreen 
                 {...commonProps} 
                 // Sobrescribimos props si es necesario para adaptar la lógica de "siguiente jugador"
                 customAction={nextReveal} 
               />
           );

      case 'PLAYING':
          return <PlayingScreen {...commonProps} />;

      case 'VOTING':
          // VotingScreen espera click en jugador -> updateRoom({ votes... })
          // Podemos interceptarlo pasando una función updateRoom modificada o creando una prop `onVote` en VotingScreen
          return (
            <VotingScreen 
                {...commonProps} 
                // Hack: Sobrescribimos updateRoom solo para esta pantalla para capturar el voto
                updateRoom={(data) => {
                    // Extraemos el ID votado del objeto { `votes.uid`: votedId }
                    const votedId = Object.values(data)[0];
                    handleVote(votedId);
                }} 
            />
          );

      case 'RESULTS':
          return <ResultsScreen {...commonProps} />;

      default:
          return null;
  }
}