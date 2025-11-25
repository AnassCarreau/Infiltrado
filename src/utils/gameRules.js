// Calcula el siguiente índice de turno buscando un jugador vivo
export const calculateNextTurn = (currentIdx, turnOrder, players) => {
    let nextIdx = currentIdx + 1;
    let loopCount = 0;
    
    // Bucle de seguridad para encontrar al siguiente vivo
    while (loopCount <= turnOrder.length) {
        if (nextIdx >= turnOrder.length) nextIdx = 0;
        
        const nextCxId = turnOrder[nextIdx];
        const player = players.find(p => p.id === nextCxId);
        
        if (player && player.isAlive) return nextIdx;
        
        nextIdx++;
        loopCount++;
    }
    return 0; // Fallback (no debería ocurrir si hay >0 vivos)
};

// Verifica si alguien ha ganado basándose en el estado actual
export const checkWinCondition = (players, impostorId, lastEjectedId = null) => {
    // 1. Si el expulsado era el impostor
    if (lastEjectedId === impostorId) {
        return { winner: 'CITIZENS', victoryType: 'Infiltrado Descubierto' };
    }

    // Contar vivos
    const alivePlayers = players.filter(p => p.isAlive);
    const impostorAlive = alivePlayers.find(p => p.id === impostorId);
    
    // 2. Si el impostor murió por otra razón
    if (!impostorAlive) {
        return { winner: 'CITIZENS', victoryType: 'Infiltrado Eliminado' };
    }

    const aliveCount = alivePlayers.length;
    const impostorCount = 1; // Asumimos 1 impostor por ahora
    const citizenCount = aliveCount - impostorCount;

    // 3. Dominio Numérico (Regla clásica: Impostores >= Ciudadanos)
    if (impostorCount >=Pc citizenCount) {
        return { winner: 'IMPOSTOR', victoryType: 'Dominio Numérico (Sabotaje)' };
    }

    return null; // Nadie ha ganado aún
};

// Genera el estado inicial de una partida
export const generateInitialState = (playersList, wordPacks) => {
    const pack = wordPacks[Math.floor(Math.random() * wordPacks.length)];
    const word = pack.words[Math.floor(Math.random() * pack.words.length)];
    const impostorIdx = Math.floor(Math.random() * playersList.length);
    
    // Mezclar orden de turnos
    const turnOrder = [...playersList].map(p => p.id).sort(() => Math.random() - 0.5);
    
    return {
        category: pack.category,
        secretWord: word,
        impostorId: playersList[impostorIdx].id,
        round: 1,
        turnOrder: turnOrder,
        currentTurnIndex: 0,
        chatLog: [],
        winner: null,
        status: 'ASSIGN'
    };
};