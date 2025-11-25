import React, { useState, useRef, useEffect } from 'react';
import { Skull, Eye, Send, CheckCircle } from 'lucide-react';

// Componente básico de contenedor (Card)
export const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-auto ${className}`}>
    {children}
  </div>
);

// Componente de botón con variantes de estilo
export const Button = ({ onClick, children, variant = "primary", className = "", disabled = false }) => {
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-md",
    outline: "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
  };
  return (
    <button 
      onClick={onClick} disabled={disabled}
      className={`w-full py-3 px-6 rounded-lg font-bold transition-all active:scale-95 flex items-center justify-center gap-2 ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </button>
  );
};


/**
 * Interfaz de chat (log de mensajes y entrada de texto).
 * Mejorado para alinear mensajes a izquierda/derecha.
 */
export const ChatInterface = ({ chatLog, players, isMyTurn, onSubmit, impostorId, myId, isDead, placeholderOverride }) => {
  const [txt, setTxt] = useState('');
  const endRef = useRef(null);
  
  // Efecto para scrollear automáticamente al último mensaje
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [chatLog]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if(txt.trim()){ onSubmit(txt); setTxt(''); }
  };
  
  const isImpostor = myId === impostorId;
  const placeholderText = placeholderOverride || (isImpostor ? "Intenta adivinar la palabra (¡Cuidado!)..." : "Escribe una pista...");

  return (
    <div className="flex flex-col h-[50vh]">
      {/* Log de mensajes */}
      <div className="flex-1 bg-white rounded-t-xl border p-4 overflow-y-auto space-y-3">
        {chatLog.length === 0 && <p className="text-center text-gray-300 italic mt-10">Esperando pistas...</p>}
        {chatLog.map((msg, i) => {
          const sender = players.find(p=>p.id===msg.playerId);
          const isMe = msg.playerId === myId; // Determina si el mensaje es del usuario local
          return (
            <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex flex-col max-w-[90%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {/* El nombre solo se muestra para los demás */}
                    {!isMe && <span className="text-[10px] font-bold text-gray-400 ml-1 mb-0.5">{sender?.name}</span>}
                    <div className={`px-3 py-2 rounded-xl text-sm border shadow-sm w-fit 
                                   ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-indigo-50 text-indigo-900 rounded-tl-none border-indigo-100'}`}>
                      {msg.text}
                    </div>
                </div>
            </div>
          );
        })}
        <div ref={endRef}/> {/* Referencia para el auto-scroll */}
      </div>
      
      {/* Interfaz de entrada de texto */}
      <div className="bg-white p-3 border-t rounded-b-xl shadow-lg relative z-10">
        {isDead ? (
             <div className="bg-red-50 text-red-800 p-2 rounded text-center text-xs font-bold border border-red-100">Estás eliminado. Solo puedes observar.</div>
        ) : isMyTurn ? (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input 
              value={txt} 
              onChange={e => setTxt(e.target.value)} 
              className="flex-1 bg-gray-50 border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
              placeholder={placeholderText} 
              autoFocus
            />
            <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors"><Send size={18}/></button>
          </form>
        ) : <div className="text-center text-xs text-gray-400 py-2 font-bold uppercase animate-pulse">Esperando turno...</div>}
      </div>
    </div>
  );
};