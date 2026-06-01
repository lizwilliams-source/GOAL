import React, { useState } from 'react';
import { Goal, Player } from '../types';
import AnimalAvatarImg from './AnimalAvatar';

interface Props {
  player: Player;
  onAdd: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

type GoalType = 'rate' | 'habit' | 'consistency';

const TYPE_INFO: Record<GoalType, { color: string; label: string; desc: string }> = {
  rate:        { color: '#60a5fa', label: '📈 Rate tracker',  desc: 'Log a number over time, see the delta' },
  habit:       { color: '#4ade80', label: '✅ Daily habit',    desc: 'Yes/no each day, track % completion' },
  consistency: { color: '#fb923c', label: '🎯 Consistency',    desc: 'X out of Y instances — hit rate' },
};

const EMOJIS = ['🎯','💼','📈','💬','📋','⚡','🔥','💪','🏆','📞','🤝','💰','🚀','⭐','🎪'];

export default function AddGoalModal({ player, onAdd, onClose }: Props) {
  const [type, setType] = useState<GoalType>('habit');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [startVal, setStartVal] = useState('');
  const [targetVal, setTargetVal] = useState('');
  const [unit, setUnit] = useState('%');
  const [targetRate, setTargetRate] = useState('90');

  const submit = () => {
    if (!title.trim()) return;
    const base = { title: title.trim(), description: desc.trim(), emoji };
    if (type === 'rate')             onAdd({ ...base, type: 'rate', unit, startValue: parseFloat(startVal)||0, targetValue: parseFloat(targetVal)||100, logs: [] });
    else if (type === 'consistency') onAdd({ ...base, type: 'consistency', targetRate: parseInt(targetRate)||80, logs: [] });
    else                             onAdd({ ...base, type: 'habit', logs: [] });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={onClose}>
      <div className="relative rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl slide-up overflow-y-auto"
        style={{ background: '#0d3b11', border: '2px solid rgba(249,201,35,0.3)', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}>

        <div className="absolute top-0 left-4 right-4 h-1 rounded-b-sm bg-white/20"/>
        <div className="absolute top-0 left-4 w-1 h-6 rounded-b-sm bg-white/20"/>
        <div className="absolute top-0 right-4 w-1 h-6 rounded-b-sm bg-white/20"/>

        <div className="flex items-center gap-3 mb-5">
          <AnimalAvatarImg animal={player.avatar} size={44}/>
          <div className="flex-1">
            <div className="font-black text-white text-sm" style={{ fontFamily: 'Oswald' }}>{player.name}</div>
            <div className="text-xs text-white/50">Adding a new goal</div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white text-xl p-1">✕</button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {EMOJIS.map(e => (
            <button key={e} onClick={() => setEmoji(e)} className="w-8 h-8 rounded-lg text-base transition-all"
              style={{ background: emoji===e?'rgba(249,201,35,0.2)':'rgba(255,255,255,0.06)', border:`2px solid ${emoji===e?'rgba(249,201,35,0.6)':'transparent'}` }}>
              {e}
            </button>
          ))}
        </div>

        <input type="text" placeholder="Goal title" value={title} onChange={e=>setTitle(e.target.value)} className="w-full mb-2" autoFocus/>
        <textarea placeholder="What does success look like?" value={desc} onChange={e=>setDesc(e.target.value)} className="w-full resize-none mb-3" rows={2}/>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {(['rate','habit','consistency'] as GoalType[]).map(t => (
            <button key={t} onClick={() => setType(t)}
              className="p-2 rounded-lg text-xs font-bold text-center transition-all"
              style={{ background: type===t?'rgba(249,201,35,0.15)':'rgba(255,255,255,0.06)', border:`2px solid ${type===t?'rgba(249,201,35,0.5)':'transparent'}`, color: type===t?'#f9c923':'rgba(255,255,255,0.5)' }}>
              <div>{TYPE_INFO[t].label}</div>
              <div className="text-[9px] mt-0.5 font-normal opacity-70">{TYPE_INFO[t].desc}</div>
            </button>
          ))}
        </div>

        {type==='rate' && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            <input type="number" placeholder="Start" value={startVal} onChange={e=>setStartVal(e.target.value)} className="w-full"/>
            <input type="number" placeholder="Target" value={targetVal} onChange={e=>setTargetVal(e.target.value)} className="w-full"/>
            <input type="text" placeholder="Unit (%)" value={unit} onChange={e=>setUnit(e.target.value)} className="w-full"/>
          </div>
        )}
        {type==='consistency' && (
          <div className="mb-3">
            <label className="text-xs text-white/40 mb-1 block">Target hit rate (%)</label>
            <input type="number" placeholder="e.g. 90" value={targetRate} onChange={e=>setTargetRate(e.target.value)} className="w-full"/>
          </div>
        )}

        <div className="flex gap-2 mt-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-white/50" style={{ background:'rgba(255,255,255,0.08)' }}>Cancel</button>
          <button onClick={submit} disabled={!title.trim()}
            className="flex-1 py-2.5 rounded-xl font-black text-sm disabled:opacity-40 hover:scale-105 transition-transform"
            style={{ background:'#f9c923', color:'#1a1a1a', fontFamily:'Oswald' }}>
            ⚽ ADD GOAL
          </button>
        </div>
      </div>
    </div>
  );
}
