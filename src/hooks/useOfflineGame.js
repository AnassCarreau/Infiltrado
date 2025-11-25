import { useState } from 'react';
import { WORD_PACKS } from '../constants/gameData';
import { generateInitialState, calculateNextTurn, checkWinCondition } from '../utils/gameRules';

export const useOfflineGame = () => {
    const [players, setPlayers] = useState([
        { id: 'p1', name: 'Jugador 1', isAlive: true },
        { id: 'p2', name: 'Jugador 2', isAlive: true },
        { id: 'p3', name: 'Jugador 3', isAlive: true }
    ]);
    
    // Estado del Juego unificado
    const [gameState, setGameState] = useState({
        status: 'LOBBY', // LOBBY, ASSIGN, PLAYING, VOTING, RESULTS
        mode: 'FREE',
        gameData: {},
        lastEjected: null,
        result: { winner: null, victoryType: '' },
        revealIdx: 0 // Auxiliar para pantalla de asignar roles
    });

    // --- ACCIONES ---

    const addPlayer = () => {
        const newId = `p${players.length + 1}`;
        setPlayers([...players, { id: newId, name: `Jugador ${players.length + 1}`, isAlive: true }]);
    };

    const removePlayer = () => {
        if (players.length > 3) setPlayers(players.slice(0, -1));
    };

    const startGame = () => {
        // Usamos la función pura para generar el estado
        const initialGameData = generateInitialState(players, WORD_PACKS);
        
        // Reseteamos jugadores a vivos
        const resetPlayers = players.map(p => ({...p, isAlive: true}));
        
        setPlayers(resetPlayers);
        setGameState(prev => ({
            ...prev,
            status: 'ASSIGN',
            gameData: initialGameData,
            lastEjected: null,
            result: { winner: null, victoryType: '' },
            revealIdx: 0
        }));
    };

    const nextReveal = () => {
        if (gameState.revealIdx < players.length - 1) {
            setGameState(prev => ({ ...prev, revealIdx: prev.revealIdx + 1 }));
        } else {
            setGameState(prev => ({ ...prev, status: 'PLAYING' }));
        }
    };

    const submitChat = (text) => {
        const { gameData } = gameState;
        const currentPlayerId = gameData.turnOrder[gameData.currentTurnIndex];

        // Regla: Impostor acierta palabra
        if (currentPlayerId === gameData.impostorId && 
            text.toLowerCase().includes(gameData.secretWord.toLowerCase())) {
            
            setGameState(prev => ({
                ...prev,
                status: 'RESULTS',
                result: { winner: 'IMPOSTOR', victoryType: 'Palabra Acertada' }
            }));
            return;
        }

        const newLog = [...gameData.chatLog, { playerId: currentPlayerId, text }];
        
        // Calculamos siguiente turno usando la lógica pura
        const nextIdx = calculateNextTurn(gameData.currentTurnIndex, gameData.turnOrder, players);
        
        // ¿Hemos dado la vuelta completa? (Fin de ronda)
        const isRoundEnd = nextIdx < gameData.currentTurnIndex; 
        
        if (isRoundEnd) {
             setGameState(prev => ({
                ...prev,
                status: 'VOTING',
                gameData: { ...prev.gameData, chatLog: newLog, currentTurnIndex: 0 } // Reset turno para votación
            }));
        } else {
            setGameState(prev => ({
                ...prev,
                gameData: { ...prev.gameData, chatLog: newLog, currentTurnIndex: nextIdx }
            }));
        }
    };

    const handleVote = (votedId) => {
        if (votedId === 'SKIP') {
            setGameState(prev => ({
                ...prev,
                status: 'PLAYING',
                gameData: { ...prev.gameData, round: prev.gameData.round + 1, currentTurnIndex: 0 }
            }));
            return;
        }

        const ejectedPlayer = players.find(p => p.id === votedId);
        const newPlayers = players.map(p => p.id === votedId ? { ...p, isAlive: false } : p);
        setPlayers(newPlayers);

        // Verificar victoria usando la lógica pura
        const winResult = checkWinCondition(newPlayers, gameState.gameData.impostorId, votedId);

        if (winResult) {
            setGameState(prev => ({
                ...prev,
                status: 'RESULTS',
                lastEjected: ejectedPlayer,
                result: winResult
            }));
        } else {
            // Nadie ganó, sigue el juego
            setGameState(prev => ({
                ...prev,
                status: 'PLAYING',
                lastEjected: ejectedPlayer,
                gameData: { ...prev.gameData, round: prev.gameData.round + 1, currentTurnIndex: 0 }
            }));
        }
    };
    
    // Acción manual para debug o victoria forzada
    const forceWin = (winner, type) => {
        setGameState(prev => ({ ...prev, status: 'RESULTS', result: { winner, victoryType: type } }));
    };

    const resetGame = () => setGameState(prev => ({ ...prev, status: 'LOBBY' }));
    const setMode = (mode) => setGameState(prev => ({ ...prev, mode }));

    return {
        players, gameState, 
        addPlayer, removePlayer, startGame, nextReveal, 
        submitChat, handleVote, forceWin, resetGame, setMode
    };
};