import React, { useState, useRef, useEffect } from 'react';
import { Skull, Eye, Send, Mic, CheckCircle, ArrowRight, Timer } from 'lucide-react';

export const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-auto ${className}`}>
    {children}
  </div>
);

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

export const GameHeader = ({ category, round, aliveCount }) => (
  <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm mb-4 border-l-4 border-indigo-500">
    <div>
      <p className="text-[10px] text-gray-400 font-bold uppercase">Categoría</p>
      <p className="font-bold text-indigo-900">{category}</p>
    </div>
    <div className="text-right">
      <p className="text-[10px] text-gray-400 font-bold uppercase">Ronda {round}</p>
      <p className="font-bold text-xs text-gray-500">{aliveCount} Vivos</p>
    </div>
  </div>
);

export const PlayerStatusList = ({ players, turnOrder, currentTurnIndex, mode }) => (
  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center">
    {players.map((p, idx) => {
      const isDead = !p.isAlive;
      // Usar turnOrder para el orden, pero iterar sobre players para la lista completa
      const isActive = p.id === turnOrder[currentTurnIndex] && !isDead;
      
      return (
        <div key={p.id} className={`flex flex-col items-center min-w-[60px] transition-all ${isActive && mode==='CHAT' ? 'scale-110' : 'opacity-80'} ${isDead ? 'grayscale opacity-40' : ''}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-1 border-2 relative ${isActive && mode==='CHAT' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-transparent bg-gray-100 text-gray-500'}`}>
            {p.name[0]}
            {isDead && <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white"><Skull size={14}/></div>}
          </div>
          <span className="text-[10px] font-bold truncate max-w-[60px]">{p.name}</span>
        </div>
      );
    })}
  </div>
);

export const RoleRevealButton = ({ isImpostor, word, category }) => {
  const [show, setShow] = useState(false);
  return (
    <button 
      onMouseDown={() => setShow(true)} onMouseUp={() => setShow(false)}
      onTouchStart={() => setShow(true)} onTouchEnd={() => setShow(false)}
      className={`w-full max-w-sm h-64 rounded-2xl flex flex-col items-center justify-center transition-all shadow-xl ${show ? (isImpostor ? 'bg-rose-600' : 'bg-emerald-600') : 'bg-slate-800'}`}
    >
      {!show ? (
        <div className="text-gray-400 animate-pulse flex flex-col items-center">
          <Eye size={48} className="mb-2"/>
          <span className="text-sm font-bold uppercase tracking-widest">Mantén para ver rol</span>
        </div> 
      ) : (
        <div className="text-white text-center animate-in zoom-in duration-200">
          <h2 className="text-3xl font-black mb-2">{isImpostor ? 'INFILTRADO' : 'CIUDADANO'}</h2>
          <div className="bg-black/20 px-6 py-3 rounded-lg backdrop-blur-sm">
            <p className="text-2xl font-bold">{isImpostor ? '???' : word}</p>
          </div>
          {!isImpostor && <p className="text-xs mt-3 opacity-75 font-mono uppercase">{category}</p>}
        </div>
      )}
    </button>
  );
};

export const ChatInterface = ({ chatLog, players, isMyTurn, onSubmit, impostorId, myId, isDead }) => {
  const [txt, setTxt] = useState('');
  const endRef = useRef(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [chatLog]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if(txt.trim()){ onSubmit(txt); setTxt(''); }
  };

  return (
    <div className="flex flex-col h-[50vh]">
      <div className="flex-1 bg-white rounded-t-xl border p-4 overflow-y-auto space-y-3">
        {chatLog.length === 0 && <p className="text-center text-gray-300 italic mt-10">Esperando pistas...</p>}
        {chatLog.map((msg, i) => (
          <div key={i} className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 ml-1 mb-0.5">{players.find(p=>p.id===msg.playerId)?.name}</span>
            <div className="bg-indigo-50 text-indigo-900 px-3 py-2 rounded-xl rounded-tl-none text-sm border border-indigo-100 shadow-sm w-fit max-w-[90%]">
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={endRef}/>
      </div>
      <div className="bg-white p-3 border-t rounded-b-xl shadow-lg relative z-10">
        {isDead ? (
             <div className="bg-red-50 text-red-800 p-2 rounded text-center text-xs font-bold border border-red-100">Estás eliminado.</div>
        ) : isMyTurn ? (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input 
              value={txt} onChange={e => setTxt(e.target.value)} 
              className="flex-1 bg-gray-50 border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
              placeholder={myId === impostorId ? "Intenta adivinar la palabra..." : "Escribe una pista..."} 
              autoFocus
            />
            <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors"><Send size={18}/></button>
          </form>
        ) : <div className="text-center text-xs text-gray-400 py-2 font-bold uppercase animate-pulse">Esperando turno...</div>}
      </div>
    </div>
  );
};