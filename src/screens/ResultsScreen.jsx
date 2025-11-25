import React from 'react';
import { CheckCircle, Skull } from 'lucide-react';
import { Card, Button } from '../components/UI';

export default function ResultsScreen({ roomData, isHost, updateRoom }) {
    const { winner, gameData, victoryType } = roomData;
    const impostorName = roomData.players.find(p=>p.id===gameData.impostorId)?.name;

    const onReset = isHost ? 
        () => updateRoom({status: 'LOBBY', votes: {}, winner: null, lastEjected: null, victoryType: ''}) 
        : null;

    return (
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
                    <p className="text-xl font-bold text-emerald-600 truncate">{gameData.secretWord}</p>
                </div>
              </div>
            </Card>
            {onReset && <div className="mt-12 w-full max-w-xs"><Button onClick={onReset} variant="secondary">Volver al Lobby</Button></div>}
        </div>
    );
}