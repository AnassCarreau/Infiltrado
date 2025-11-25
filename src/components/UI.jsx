import React, { useState, useEffect } from 'react';
import { Copy, Clock } from 'lucide-react';

export const Button = ({ children, onClick, disabled, variant = 'primary' }) => {
    const styles = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700",
        secondary: "bg-slate-700 text-slate-200 hover:bg-slate-600",
        danger: "bg-rose-600 text-white hover:bg-rose-700"
    };
    return (
        <button onClick={onClick} disabled={disabled} className={`w-full py-3 rounded-xl font-bold transition-transform active:scale-95 disabled:opacity-50 ${styles[variant]}`}>
            {children}
        </button>
    );
};

export const Timer = ({ seconds, onFinish, active = true }) => {
    const [timeLeft, setTimeLeft] = useState(seconds);

    useEffect(() => {
        if (!active) return;
        if (timeLeft <= 0) { onFinish?.(); return; }
        const interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        return () => clearInterval(interval);
    }, [timeLeft, active]);

    return (
        <div className={`font-mono font-bold text-xl flex items-center gap-2 ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
            <Clock size={18}/> {timeLeft}s
        </div>
    );
};

export const CopyLink = ({ code }) => {
    const copy = () => {
        navigator.clipboard.writeText(`${window.location.origin}/?room=${code}`);
        alert("Link copiado al portapapeles");
    };
    return (
        <button onClick={copy} className="bg-slate-800 border border-slate-700 px-3 py-1 rounded text-xs flex items-center gap-2 text-indigo-400 hover:text-white">
            <Copy size={12}/> Copiar Invitación
        </button>
    );
};