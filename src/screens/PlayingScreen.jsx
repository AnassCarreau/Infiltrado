import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { GameHeader, PlayerStatusList, Button, ChatInterface } from '../components/UI';

export default function PlayingScreen({ roomData, user, myPlayer, isHost, updateRoom, submitChat }) {
    const { gameData } = roomData;
    const isMyTurn = gameData.turnOrder[gameData.currentTurnIndex] === user.uid;
    const isImpostor = user.uid === gameData.impostorId;
    
    // Función wrapper para submitChat del Hook
    const handleChatSubmit = (text) => {
        submitChat(text, user.uid);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-4 flex flex-col">
            {roomData.lastEjected && (
                <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-4 rounded shadow-sm" role="alert">
                    <p className="font-bold">Resultados Votación</p>
                    <p>{roomData.lastEjected.name} fue expulsado. Era <span className="font-black">INOCENTE</span>.</p>
                </div>
            )}

            <GameHeader category={gameData.category} round={gameData.round} aliveCount={roomData.players.filter(p=>p.isAlive).length} />
            
            <div className="mb-4">
                 <PlayerStatusList players={roomData.players} turnOrder={gameData.turnOrder} currentTurnIndex={gameData.currentTurnIndex} mode={roomData.mode} />
            </div>
            
            {roomData.mode === 'CHAT' ? (
                <ChatInterface 
                    chatLog={gameData.chatLog} players={roomData.players}
                    isMyTurn={isMyTurn} onSubmit={handleChatSubmit} 
                    impostorId={gameData.impostorId} myId={user.uid}
                    isDead={!myPlayer.isAlive}
                />
            ) : (
                <div className="bg-white p-8 rounded-2xl shadow-lg mt-4 text-center flex-1 flex flex-col justify-center items-center border border-indigo-50">
                    {/* Contenido del Modo Voz (Libre) */}
                    {isHost ? <Button onClick={() => updateRoom({status: 'VOTING'})}>IR A VOTACIÓN</Button> : <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Esperando al Host...</p>}
                    
                    {/* REGLA GDD: Botón de Victoria Manual para Impostor en Modo Voz */}
                    {myPlayer.isAlive && !isImpostor && (
                         <button 
                            onClick={() => updateRoom({winner: 'IMPOSTOR', status: 'RESULTS', victoryType: 'Reconocido por Ciudadano'})} 
                            className="mt-8 text-rose-500 text-xs font-bold border border-rose-200 px-4 py-2 rounded-full hover:bg-rose-50 transition-colors flex items-center gap-2">
                            <AlertTriangle size={14}/> ¡HE OÍDO LA PALABRA! (Gana Infiltrado)
                         </button>
                     )}
                </div>
            )}
        </div>
    );
}