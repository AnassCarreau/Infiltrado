import { Smartphone, Globe, ArrowRight } from 'lucide-react';
import OnlineGame from './OnlineGame.jsx'; // Importamos el orquestador online
// Importamos la lógica del juego offline (asumiendo que crearás este archivo)
import OfflineGame from './OfflineGame.jsx'; 
type AppMode = null | 'OFFLINE' | 'ONLINE';
import { useState } from 'react';

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>(null);
  if (appMode === 'OFFLINE') return <OfflineGame onExit={() => setAppMode(null)} />;
  if (appMode === 'ONLINE') return <OnlineGame onExit={() => setAppMode(null)} />;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="relative z-10 text-center w-full max-w-md">
        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 mb-2 tracking-tighter">EL INFILTRADO</h1>
        <p className="text-indigo-200 mb-12 text-lg font-medium">Engaña, deduce y sobrevive.</p>
        <div className="space-y-4">
          <button onClick={() => setAppMode('OFFLINE')} className="w-full bg-white hover:bg-indigo-50 text-slate-900 p-6 rounded-2xl shadow-xl flex items-center justify-between group transition-all active:scale-95">
             <div className="flex items-center gap-4">
                <div className="bg-indigo-100 p-3 rounded-full text-indigo-600"><Smartphone size={32} /></div>
                <div className="text-left"><h3 className="font-bold text-xl">Modo Local</h3><p className="text-gray-500 text-sm">1 Dispositivo • Pasando el móvil</p></div>
             </div>
             <ArrowRight className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
          </button>
          <button onClick={() => setAppMode('ONLINE')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-2xl shadow-xl flex items-center justify-between group border border-indigo-500 transition-all active:scale-95">
             <div className="flex items-center gap-4">
                <div className="bg-indigo-800 p-3 rounded-full text-indigo-200"><Globe size={32} /></div>
                <div className="text-left"><h3 className="font-bold text-xl">Modo Online</h3><p className="text-indigo-200 text-sm">Multijugador • Tiempo Real</p></div>
             </div>
             <ArrowRight className="text-indigo-400 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}