import React from 'react';
import { Button, RoleRevealButton } from '../components/UI';

export default function AssignScreen({ roomData, user, isHost, updateRoom }) {
    
    const { gameData } = roomData;
    const isImpostor = user.uid === gameData.impostorId;
    
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
           <h2 className="text-xl font-bold mb-6 text-indigo-200">Tu Identidad Secreta</h2>
           <RoleRevealButton isImpostor={isImpostor} word={gameData.secretWord} category={gameData.category} />
           
           {isHost ? (
             <div className="mt-10 w-full max-w-xs"><Button onClick={() => updateRoom({status: 'PLAYING'})}>EMPEZAR RONDA 1</Button></div>
           ) : <p className="mt-10 text-gray-500 text-sm animate-pulse font-mono">ESPERANDO AL HOST...</p>}
        </div>
    );
}