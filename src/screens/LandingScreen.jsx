import React, { useState } from 'react';
import { Home, Globe } from 'lucide-react';
import { Card, Button } from '../components/UI';

export default function LandingScreen({ user, gameLogic, onExit }) {
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');
  
  const handleCreate = () => { gameLogic.createRoom(nickname); gameLogic.setErrorMsg(''); };
  const handleJoin = () => { gameLogic.joinRoom(code, nickname); gameLogic.setErrorMsg(''); };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 left-4"><button onClick={onExit} className="text-white flex gap-2"><Home/> Inicio</button></div>
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500 mb-6">MODO ONLINE</h2>
      <Card>
        <div className="mb-4">
          <label className="text-xs font-bold text-gray-500">Tu Nickname</label>
          <input value={nickname} onChange={e => setNickname(e.target.value)} className="w-full p-2 border rounded font-bold uppercase" placeholder="NOMBRE..."/>
        </div>
        <Button onClick={handleCreate} disabled={!user || !nickname}>{!user ? 'CONECTANDO...' : 'CREAR SALA'}</Button>
        <div className="text-center my-4 text-gray-400 text-sm">- O -</div>
        <div className="flex gap-2">
          <input value={code} onChange={e => setCode(e.target.value)} className="flex-1 p-2 border rounded uppercase text-center font-mono" placeholder="CÓDIGO"/>
          <Button onClick={handleJoin} variant="secondary" className="w-auto" disabled={!user || !code}>ENTRAR</Button>
        </div>
        {gameLogic.errorMsg && <p className="text-red-500 text-center mt-2 font-bold text-sm">{gameLogic.errorMsg}</p>}
      </Card>
    </div>
  );
}