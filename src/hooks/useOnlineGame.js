import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { generateGameParams, checkVictory } from '../core/gameLogic';
import { STATUS } from '../constants/gameData';

export const useOnlineGame = (user) => {
    const [roomCode, setRoomCode] = useState(null);
    const [roomData, setRoomData] = useState(null);
    const [error, setError] = useState('');

    // --- DEEP LINKING ---
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const codeParam = params.get('room');
        if (codeParam && user) {
            joinRoom(codeParam, "Invitado"); // Nota: Mejorar UX para pedir nombre
        }
    }, [user]);

    // --- LISTENER ---
    useEffect(() => {
        if (!roomCode) return;
        const unsub = onSnapshot(doc(db, 'rooms', roomCode), (snap) => {
            if (snap.exists()) setRoomData(snap.data());
            else setError("Sala no encontrada");
        });
        return () => unsub();
    }, [roomCode]);

    // --- ACCIONES ---
    const createRoom = async (nickname) => {
        const code = Math.random().toString(36).substring(2, 6).toUpperCase();
        await setDoc(doc(db, 'rooms', code), {
            code,
            hostId: user.uid,
            status: STATUS.LOBBY,
            mode: 'TEXT', // Default
            players: [{ id: user.uid, name: nickname, isAlive: true }],
            createdAt: serverTimestamp()
        });
        setRoomCode(code);
    };

    const joinRoom = async (code, nickname) => {
        const codeUp = code.toUpperCase();
        try {
            await updateDoc(doc(db, 'rooms', codeUp), {
                players: arrayUnion({ id: user.uid, name: nickname, isAlive: true })
            });
            setRoomCode(codeUp);
        } catch (e) { setError("Error al entrar (Sala llena o inexistente)"); }
    };

    const startGame = async () => {
        const gameParams = generateGameParams(roomData.players);
        await updateDoc(doc(db, 'rooms', roomCode), {
            status: STATUS.ASSIGN,
            gameData: gameParams,
            votes: {}
        });
    };

    const submitChat = async (text) => {
        const { gameData } = roomData;
        
        // Victoria Inmediata si Impostor dice palabra (Chat Mode)
        if (user.uid === gameData.impostorId && text.toLowerCase().includes(gameData.secretWord.toLowerCase())) {
            await updateDoc(doc(db, 'rooms', roomCode), { 
                status: STATUS.RESULTS, winner: 'IMPOSTOR', victoryType: 'Palabra Acertada en Chat' 
            });
            return;
        }

        const nextIdx = gameData.currentTurnIndex + 1;
        const roundOver =njextIdx >= gameData.turnOrder.length;

        await updateDoc(doc(db, 'rooms', roomCode), {
            'gameData.chatLog': [...gameData.chatLog, { playerId: user.uid, text }],
            'gameData.currentTurnIndex': roundOver ? 0 : nextIdx,
            status: roundOver ? STATUS.VOTING : STATUS.PLAYING
        });
    };

    const handleVote = async (targetId) => {
        await updateDoc(doc(db, 'rooms', roomCode), { [`votes.${user.uid}`]: targetId });
    };

    const resolveVotes = async () => {
        // Lógica de conteo simple
        const votes = roomData.votes || {};
        const counts = {};
        Object.values(votes).forEach(v => counts[v] = (counts[v] || 0) + 1);
        
        // Encontrar el más votado
        let max = 0, ejectedId = null, tie = false;
        Object.entries(counts).forEach(([id, c]) => {
            if (c > max) { max = c; ejectedId = id; tie = false; }
            else if (c === max) tie = true;
        });

        if (!ejectedId || tie || ejectedId === 'SKIP') {
            // Nadie expulsado
            await updateDoc(doc(db, 'rooms', roomCode), { 
                status: STATUS.PLAYING, 'gameData.round': roomData.gameData.round + 1, votes: {} 
            });
            return;
        }

        // Alguien expulsado
        const newPlayers = roomData.players.map(p => p.id === ejectedId ? {...p, isAlive: false} : p);
        const win = checkVictory(newPlayers, roomData.gameData.impostorId, ejectedId);

        if (win) {
            await updateDoc(doc(db, 'rooms', roomCode), { 
                status: STATUS.RESULTS, winner: win.winner, victoryType: win.type, players: newPlayers 
            });
        } else {
            await updateDoc(doc(db, 'rooms', roomCode), { 
                status: STATUS.PLAYING, players: newPlayers, votes: {},
                lastEjected: roomData.players.find(p => p.id === ejectedId) 
            });
        }
    };

    return { 
        roomCode, roomData, error, 
        createRoom, joinRoom, startGame, submitChat, handleVote, resolveVotes,
        updateRoom: (data) => updateDoc(doc(db, 'rooms', roomCode), data)
    };
};