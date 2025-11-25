import React from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '../components/UI';
import { getFirestore, updateDoc, arrayRemove, doc } from 'firebase/firestore';
import { APP_ID } from '../config/firebase';

const getRoomRef = (code) => doc(getFirestore(), 'artifacts', APP_ID, 'public', 'data', 'rooms', `room_${code.toUpperCase()}`);

export default function LobbyScreen({ roomData, user, updateRoom, onExit, myPlayer, isHost, startGame }) {
    
    const handleExit = async () => {
        const roomRef = getRoomRef(roomData.code);
        await updateDoc(roomRef, { players: arrayRemove(myPlayer) });
        onExit(); 
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6">
            <div className="w-full flex justify-between items-center mb-8">
                 <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded text-xs font-bold font-mono">SALA: {roomData.code}</span>
                 <button onClick={handleExit} className="text-red-500 text-xs font-bold flex gap-1 items-center hover:bg-red-50 px-2 py-1 rounded"><LogOut size={14}/> SALIR</button>
            </div>
            
            <h1 className="text-6xl font-mono font-black text-indigo-600 mb-2 tracking-tighter">{roomData.code}</h1>
            <p className="text-gray-400 mb-8 text-sm font-medium">Comparte este código</p>
            
            {isHost ? (
                <div className="flex bg-gray-200 p-1 rounded-lg mb-8 w-full max-w-xs">
                   <button onClick={() => updateRoom({mode: 'FREE'})} className={`flex-1 py-2 text-xs font-bold rounded ${roomData.mode==='FREE'?'bg-white shadow text-indigo-600':''}`}>VOZ (LIBRE)</button>
                   <button onClick={() => updateRoom({mode: 'CHAT'})} className={`flex-1 py-2 text-xs font-bold rounded ${roomData.mode==='CHAT'?'bg-white shadow text-indigo-600':''}`}>CHAT (TURNOS)</button>
                </div>
            ) : <div className="text-xs bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full font-bold mb-8">MODO: {roomData.mode === 'FREE' ? 'VOZ' : 'CHAT'}</div>}

            <div className="w-full max-w-md space-y-3 mb-8">
               {roomData.players.map(p => (
                 <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 border border-gray-100">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600">{p.name[0]}</div>
                    <span className={`font-bold ${p.id === user.uid ? 'text-indigo-600' : 'text-gray-700'}`}>{p.name} {p.id === user.uid && '(Tú)'}</span>
                    {p.id === roomData.hostId && <span className="ml-auto text-[10px] bg-yellow-100 px-2 py-1 rounded text-yellow-800 font-bold">HOST</span>}
                 </div>
               ))}
            </div>
            
            {isHost ? (
              <Button onClick={startGame} disabled={roomData.players.length < 3} className="max-w-md shadow-xl shadow-indigo-200">
                {roomData.players.length < 3 ? `FALTAN ${3 - roomData.players.length} JUGADORES` : 'INICIAR PARTIDA'}
              </Button>
            ) : <p className="animate-pulse text-gray-400 font-medium">Esperando al anfitrión...</p>}
        </div>
    );
}