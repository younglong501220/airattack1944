import React, { useState } from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { sound } from '../game/audio';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onReturnHangar: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onReturnHangar,
}) => {
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());
  const [volume, setVolume] = useState(sound.getVolume());

  const toggleSound = () => {
    sound.init();
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    sound.setVolume(val);
  };

  return (
    <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-slate-950 border border-slate-700/80 rounded-xl p-6 shadow-2xl flex flex-col gap-5">
        <div className="text-center border-b border-slate-800 pb-3">
          <div className="text-xs font-['Chakra_Petch'] text-amber-400 tracking-widest uppercase">
            作戰暫停 PAUSED
          </div>
          <div className="font-['Teko'] text-3xl font-bold tracking-wider text-white">
            戰術指令休止
          </div>
        </div>

        {/* Audio Controls */}
        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col gap-2 font-['Chakra_Petch'] text-xs text-slate-300">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              戰場引擎與砲火音效
            </span>
            <button
              onClick={toggleSound}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
            >
              {isMuted ? '開啟音效' : '靜音'}
            </button>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <span className="text-[11px] text-slate-400">音量</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <span className="text-[11px] text-slate-400 w-8 text-right">{Math.round(volume * 100)}%</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-['Teko'] text-2xl font-bold tracking-widest uppercase rounded shadow flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Play className="w-5 h-5 fill-current" /> 繼續作戰 RESUME
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-['Teko'] text-xl font-bold tracking-widest uppercase rounded flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" /> 重新開局 RESTART
          </button>

          <button
            onClick={onReturnHangar}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-['Teko'] text-xl font-bold tracking-widest uppercase rounded flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Home className="w-4 h-4 text-sky-400" /> 返回機庫 HANGAR
          </button>
        </div>
      </div>
    </div>
  );
};
