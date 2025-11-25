import { WORD_PACKS } from '../constants/gameData';

export const generateGameParams = (players) => {
    const pack = WORD_PACKS[Math.floor(Math.random() * WORD_PACKS.length)];
    const word = pack.words[Math.floor(Math.random() * pack.words.length)];
    const impostorIdx = Math.floor(Math.random() * players.length);
    
    // Filtramos solo vivos y mezclamos orden
    const turnOrder = players.filter(p => p.isAlive).map(p => p.id).sort(() => Math.random() - 0.5);

    return {
        category: pack.category,
        secretWord: word,
        impostorId: players[impostorIdx].id,
        turnOrder,
        currentTurnIndex: 0,
        round: 1,
        chatLog: []
    };
};

export const checkVictory = (players, impostorId, ejectedId = null) => {
    // 1. Infiltrado expulsado -> Ganan Ciudadanos
    if (ejectedId === impostorId) {
        return { winner: 'CITIZENS', type: 'Infiltrado Descubierto' };
    }

    const alive = players.filter(p => p.isAlive);
    const impostorAlive = alive.find(p => p.id === impostorId);

    // 2. Infiltrado eliminado (por otra razón) -> Ganan Ciudadanos
    if (!impostorAlive) {
        return { winner: 'CITIZENS', type: 'Infiltrado Eliminado' };
    }

    // 3. Dominio Numérico (1 vs 1 o 1 vs 0) -> Gana Infiltrado
    const citizensCount = alive.length - 1; 
    if (citizensCount <= 1) {
        return { winner: 'IMPOSTOR', type: 'Sabotaje (Dominio Numérico)' };
    }

    return null; // El juego sigue
};