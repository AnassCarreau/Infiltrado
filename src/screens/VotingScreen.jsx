import React from 'react';
import { Button, Card } from '../components/UI';

export default function VotingScreen({ roomData, user, myPlayer, isHost, updateRoom, handleVoting }) {
    
    // Obtener jugadores vivos para la votación
    const alivePlayers = roomData.players.filter(p => p.isAlive);
    
    return (
        <div className="min-h-screen bg-indigo-900 p-6 flex flex-col items-center justify-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           
           <h2 className="text-white text-3xl font-black mb-2 z-10">¿QUIÉN ES EL INFILTRADO?</h2>
           <p className="text-indigo-300 mb-8 z-10">Vota para expulsar</p>
           
           {!myPlayer.isAlive ? 
               <div className="bg-indigo-800/50 p-4 rounded-xl text-indigo-200 mb-4 z-10 border border-indigo-700">Has sido eliminado. No puedes votar.</div> 
           : (
               <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8 z-10">
                  {alivePlayers.map(p => {
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
               {isHost && 
                   <Button 
                       onClick={handleVoting} 
                       disabled={Object.keys(roomData.votes).length < alivePlayers.length}
                   >
                       CERRAR VOTACIÓN
                   </Button>
               }
               {!isHost && <p className="text-indigo-300 animate-pulse mt-4 text-center font-bold">ESPERANDO RESULTADOS...</p>}
           </div>
        </div>
    );
}