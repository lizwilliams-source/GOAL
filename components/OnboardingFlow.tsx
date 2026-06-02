import React, { useState } from 'react';
import { AnimalKind, Player, Goal } from '../types';
import AnimalAvatar, { ANIMAL_NAMES, ALL_ANIMALS } from './AnimalAvatar';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  takenAvatars: AnimalKind[];
  onComplete: (player: Omit<Player, 'id' | 'createdAt'>) => void;
}

type Step = 'avatar' | 'name' | 'goals';

type GoalType = 'rate' | 'habit' | 'consistency' | 'cumulative';

const TYPE_INFO: Record<GoalType, { color: string; label: string; desc: string }> = {
  rate:        { color: '#60a5fa', label: '📈 Rate tracker',  desc: 'Log a number over time, see the delta' },
  habit:       { color: '#4ade80', label: '✅ Daily habit',    desc: 'Yes/no each day, track % completion' },
  consistency: { color: '#fb923c', label: '🎯 Consistency',    desc: 'X out of Y instances — hit rate' },
  cumulative:  { color: '#a78bfa', label: '🔢 Cumulative',     desc: 'Add up totals, track pace vs 21-day month' },
};

const TEMPLATES = [
  { type: 'consistency' as GoalType, title: 'Handle pricing objection better', description: 'Navigate "how much does it cost" without giving price', emoji: '💬', targetRate: 85 },
  { type: 'consistency' as GoalType, title: 'Mention setup fee on every demo', description: 'Log how many demos you brought up the setup fee on', emoji: '📋', targetRate: 100 },
  { type: 'rate'        as GoalType, title: 'Improve close rate from 33% to 40%', description: 'Track close rate over the month', emoji: '📈', unit: '%', startValue: 30, targetValue: 40 },
  { type: 'habit'       as GoalType, title: 'Hit 200 WIN daily', description: '200+ Work Effort metric every working day', emoji: '💼' },
  { type: 'habit'       as GoalType, title: 'Source 25 fresh leads every day', description: 'Self-prospect 25 leads every dat', emoji: '⚡' },
  { type: 'cumulative'  as GoalType, title: 'Set 40 Demos this month', description: 'Set 40 qualified demos this month', emoji: '📞', targetTotal: 40, unit: 'Sets', targetPeriod: 'monthly' },
  { type: 'cumulative'  as GoalType, title: 'Hold 10 Demos this month', description: 'Hold a demo every other day', emoji: '📅', targetTotal: 10, unit: 'Holds', targetPeriod: 'monthly' },
];

const EMOJIS = ['🎯','💼','📈','💬','📋','⚡','🔥','💪','🏆','📞','🤝','💰','🚀','⭐','🎪'];

function mkGoal(tmpl: typeof TEMPLATES[0]): Goal {
  const base = { id: uuidv4(), title: tmpl.title, description: tmpl.description, emoji: tmpl.emoji, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  if (tmpl.type === 'consistency') return { ...base, type: 'consistency', targetRate: (tmpl as any).targetRate ?? 80, logs: [] };
  if (tmpl.type === 'rate')        return { ...base, type: 'rate', unit: (tmpl as any).unit ?? '%', startValue: (tmpl as any).startValue ?? 0, targetValue: (tmpl as any).targetValue ?? 100, logs: [] };
  if (tmpl.type === 'cumulative')  return { ...base, type: 'cumulative', targetTotal: (tmpl as any).targetTotal ?? 100, unit: (tmpl as any).unit ?? 'items', targetPeriod: (tmpl as any).targetPeriod ?? 'monthly', logs: [] };
  return { ...base, type: 'habit', logs: [] };
}

function CustomForm({ onAdd, onCancel }: { onAdd: (g: Goal) => void; onCancel: () => void }) {
  const [type, setType] = useState<GoalType>('habit');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [startVal, setStartVal] = useState('');
  const [targetVal, setTargetVal] = useState('');
  const [unit, setUnit] = useState('%');
  const [targetRate, setTargetRate] = useState('90');
  const [targetTotal, setTargetTotal] = useState('');
  const [cumUnit, setCumUnit] = useState('');
  const [cumPeriod, setCumPeriod] = useState<'monthly' | 'weekly'>('monthly');

  const submit = () => {
    if (!title.trim()) return;
    const base = { id: uuidv4(), title: title.trim(), description: desc.trim(), emoji, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    if (type === 'rate')             onAdd({ ...base, type: 'rate', unit, startValue: parseFloat(startVal)||0, targetValue: parseFloat(targetVal)||100, logs: [] });
    else if (type === 'consistency') onAdd({ ...base, type: 'consistency', targetRate: parseInt(targetRate)||80, logs: [] });
    else if (type === 'cumulative')  onAdd({ ...base, type: 'cumulative', targetTotal: parseFloat(targetTotal)||100, unit: cumUnit||'items', targetPeriod: cumPeriod, logs: [] });
    else                             onAdd({ ...base, type: 'habit', logs: [] });
  };

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="flex flex-wrap gap-1.5">
        {EMOJIS.map(e => (
          <button key={e} onClick={() => setEmoji(e)} className="w-8 h-8 rounded-lg text-base transition-all"
            style={{ background: emoji===e?'rgba(249,201,35,0.2)':'rgba(255,255,255,0.06)', border:`2px solid ${emoji===e?'rgba(249,201,35,0.6)':'transparent'}` }}>{e}</button>
        ))}
      </div>
      <input type="text" placeholder="Goal title" value={title} onChange={e=>setTitle(e.target.value)} className="w-full"/>
      <textarea placeholder="What does success look like?" value={desc} onChange={e=>setDesc(e.target.value)} className="w-full resize-none" rows={2}/>
      <div className="grid grid-cols-2 gap-2">
        {(['rate','habit','consistency','cumulative'] as GoalType[]).map(t => (
          <button key={t} onClick={() => setType(t)} className="p-2 rounded-lg text-xs font-bold text-center transition-all"
            style={{ background: type===t?'rgba(249,201,35,0.15)':'rgba(255,255,255,0.06)', border:`2px solid ${type===t?'rgba(249,201,35,0.5)':'transparent'}`, color: type===t?'#f9c923':'rgba(255,255,255,0.5)' }}>
            {TYPE_INFO[t].label}
          </button>
        ))}
      </div>
      {type==='rate' && (
        <div className="grid grid-cols-3 gap-2">
          <input type="number" placeholder="Start" value={startVal} onChange={e=>setStartVal(e.target.value)} className="w-full"/>
          <input type="number" placeholder="Target" value={targetVal} onChange={e=>setTargetVal(e.target.value)} className="w-full"/>
          <input type="text" placeholder="Unit (%)" value={unit} onChange={e=>setUnit(e.target.value)} className="w-full"/>
        </div>
      )}
      {type==='consistency' && (
        <div>
          <label className="text-xs text-white/40 mb-1 block">Target hit rate (%)</label>
          <input type="number" placeholder="e.g. 90" value={targetRate} onChange={e=>setTargetRate(e.target.value)} className="w-full"/>
        </div>
      )}
      {type==='cumulative' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            {(['monthly', 'weekly'] as const).map(p => (
              <button key={p} onClick={() => setCumPeriod(p)}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all capitalize"
                style={{ background: cumPeriod===p ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.06)', border: `1.5px solid ${cumPeriod===p ? 'rgba(167,139,250,0.6)' : 'transparent'}`, color: cumPeriod===p ? '#a78bfa' : 'rgba(255,255,255,0.4)' }}>
                {p}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-white/40 mb-1 block">{cumPeriod === 'weekly' ? 'Weekly' : 'Monthly'} target</label>
              <input type="number" placeholder="e.g. 100" value={targetTotal} onChange={e=>setTargetTotal(e.target.value)} className="w-full"/>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Unit</label>
              <input type="text" placeholder="calls, demos..." value={cumUnit} onChange={e=>setCumUnit(e.target.value)} className="w-full"/>
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2 rounded-lg text-xs text-white/50" style={{ background:'rgba(255,255,255,0.06)' }}>Cancel</button>
        <button onClick={submit} disabled={!title.trim()} className="flex-1 py-2 rounded-lg text-xs font-black disabled:opacity-40" style={{ background:'#f9c923', color:'#1a1a1a' }}>Add</button>
      </div>
    </div>
  );
}

export default function OnboardingFlow({ takenAvatars, onComplete }: Props) {
  const [step, setStep] = useState<Step>('avatar');
  const [animal, setAnimal] = useState<AnimalKind | null>(null);
  const [name, setName] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showCustom, setShowCustom] = useState(false);

  const finish = () => {
    if (!animal || !name.trim() || goals.length === 0) return;
    onComplete({ name: name.trim(), avatar: animal, jerseyColor: '', goals, onboarded: true });
  };

  const stepIdx = step === 'avatar' ? 0 : step === 'name' ? 1 : 2;

  return (
    <div className="min-h-screen pitch-bg grass-lines flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-5">
          <h1 className="text-3xl text-yellow-400 tracking-widest mb-1" style={{ fontFamily:'Black Han Sans', textShadow:'0 2px 16px rgba(249,201,35,0.4)' }}>
            <span className="sm:hidden">GOOOOOAL</span>
            <span className="hidden sm:inline">GOOOOOOOOOOOOOOOOOOAL</span>
          </h1>
          <p className="text-white/35 text-[10px] tracking-widest uppercase">
            {step==='avatar'?'Step 1 of 3 — Pick your player':step==='name'?'Step 2 of 3 — Name your player':'Step 3 of 3 — Set your goals'}
          </p>
          <div className="flex justify-center gap-2 mt-2">
            {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full transition-all duration-300" style={{ background: i===stepIdx?'#f9c923':i<stepIdx?'rgba(249,201,35,0.4)':'rgba(255,255,255,0.15)' }}/>)}
          </div>
        </div>

        {step === 'avatar' && (
          <div className="rounded-2xl p-5 slide-up" style={{ background:'rgba(0,0,0,0.45)', border:'2px solid rgba(249,201,35,0.2)' }}>
            <h2 className="text-base font-black text-white mb-1" style={{ fontFamily:'Black Han Sans' }}>Choose your player</h2>
            <p className="text-white/40 text-xs mb-4">Each person gets a unique character for the month</p>
            <div className="grid grid-cols-5 gap-2 mb-5">
              {ALL_ANIMALS.map(a => {
                const taken = takenAvatars.includes(a);
                const sel = animal === a;
                return (
                  <button key={a} onClick={() => !taken && setAnimal(a)} disabled={taken}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200"
                    style={{ background: sel?'rgba(249,201,35,0.18)':taken?'rgba(0,0,0,0.2)':'rgba(255,255,255,0.06)', border:`2px solid ${sel?'rgba(249,201,35,0.8)':'transparent'}`, opacity:taken?0.35:1, transform:sel?'scale(1.08)':'scale(1)' }}>
                    <AnimalAvatar animal={a} size={56}/>
                    <span className="text-[9px] leading-tight text-center" style={{ color:sel?'#f9c923':'rgba(255,255,255,0.45)' }}>{ANIMAL_NAMES[a]}</span>
                    {taken && <span className="text-[8px] text-red-400">Taken</span>}
                  </button>
                );
              })}
            </div>
            <button onClick={() => animal && setStep('name')} disabled={!animal}
              className="w-full py-3 rounded-xl font-black text-sm disabled:opacity-40 hover:scale-105 transition-transform"
              style={{ background:'#f9c923', color:'#1a1a1a', fontFamily:'Oswald', letterSpacing:'0.05em' }}>
              NEXT: NAME YOUR PLAYER →
            </button>
          </div>
        )}

        {step === 'name' && animal && (
          <div className="rounded-2xl p-5 slide-up" style={{ background:'rgba(0,0,0,0.45)', border:'2px solid rgba(249,201,35,0.2)' }}>
            <div className="flex justify-center mb-4">
              <AnimalAvatar animal={animal} size={110}/>
            </div>
            <h2 className="text-base font-black text-white mb-0.5 text-center" style={{ fontFamily:'Black Han Sans' }}>Name your {ANIMAL_NAMES[animal]}</h2>
            <p className="text-white/40 text-xs text-center mb-4">Your name or nickname</p>
            <input type="text" placeholder='e.g. Alex, "The Closer"...' value={name}
              onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&name.trim()&&setStep('goals')}
              className="w-full text-center mb-4" style={{ fontSize:'18px', padding:'12px' }} autoFocus/>
            <div className="flex gap-3">
              <button onClick={() => setStep('avatar')} className="px-4 py-2.5 rounded-xl text-sm text-white/50" style={{ background:'rgba(255,255,255,0.08)' }}>← Back</button>
              <button onClick={() => name.trim()&&setStep('goals')} disabled={!name.trim()}
                className="flex-1 py-2.5 rounded-xl font-black text-sm disabled:opacity-40 hover:scale-105 transition-transform"
                style={{ background:'#f9c923', color:'#1a1a1a', fontFamily:'Oswald' }}>
                NEXT: SET GOALS →
              </button>
            </div>
          </div>
        )}

        {step === 'goals' && animal && (
          <div className="rounded-2xl p-5 slide-up" style={{ background:'rgba(0,0,0,0.45)', border:'2px solid rgba(249,201,35,0.2)' }}>
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background:'rgba(0,0,0,0.3)' }}>
              <AnimalAvatar animal={animal} size={56}/>
              <div className="flex-1">
                <div className="font-black text-white" style={{ fontFamily:'Oswald' }}>{name}</div>
                <div className="text-xs text-white/40">{ANIMAL_NAMES[animal]}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-yellow-400" style={{ fontFamily:'Black Han Sans' }}>{goals.length}/2</div>
                <div className="text-[10px] text-white/30">goals</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {(Object.entries(TYPE_INFO) as [GoalType, typeof TYPE_INFO[GoalType]][]).map(([t, info]) => (
                <div key={t} className="p-2 rounded-xl text-center" style={{ background:'rgba(0,0,0,0.25)', border:`1px solid ${info.color}25` }}>
                  <div className="text-xs font-bold mb-1" style={{ color:info.color }}>{info.label}</div>
                  <div className="text-[9px] leading-snug" style={{ color:'rgba(255,255,255,0.35)' }}>{info.desc}</div>
                </div>
              ))}
            </div>

            {goals.map((g, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl mb-2" style={{ background:'rgba(0,0,0,0.3)', border:`1px solid ${TYPE_INFO[g.type as GoalType]?.color}40` }}>
                <span className="text-lg">{g.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white leading-tight">{g.title}</div>
                  <div className="text-[10px] mt-0.5" style={{ color:TYPE_INFO[g.type as GoalType]?.color }}>{TYPE_INFO[g.type as GoalType]?.label}</div>
                </div>
                <button onClick={() => setGoals(prev=>prev.filter((_,j)=>j!==i))} className="text-white/30 hover:text-red-400 transition-colors p-1 text-sm">✕</button>
              </div>
            ))}

            {showCustom ? (
              <CustomForm onAdd={g=>{setGoals(prev=>[...prev,g]);setShowCustom(false);}} onCancel={()=>setShowCustom(false)}/>
            ) : goals.length < 2 ? (
              <>
                <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Quick add</div>
                <div className="space-y-1.5 mb-3">
                  {TEMPLATES.map((tmpl, i) => (
                    <button key={i} onClick={() => setGoals(prev=>[...prev, mkGoal(tmpl)])}
                      className="w-full flex items-center gap-2 p-2.5 rounded-xl text-left hover:scale-[1.01] transition-all"
                      style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)' }}>
                      <span className="text-lg">{tmpl.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white leading-tight">{tmpl.title}</div>
                        <div className="text-[10px]" style={{ color:TYPE_INFO[tmpl.type]?.color }}>{TYPE_INFO[tmpl.type]?.label}</div>
                      </div>
                      <span className="text-white/30 text-lg flex-shrink-0">+</span>
                    </button>
                  ))}
                </div>
                <button onClick={()=>setShowCustom(true)}
                  className="w-full py-2 rounded-xl text-xs font-semibold text-white/50 hover:text-white transition-colors"
                  style={{ background:'rgba(255,255,255,0.06)', border:'1px dashed rgba(255,255,255,0.15)' }}>
                  + Write a custom goal
                </button>
              </>
            ) : (
              <div className="text-center py-2 text-white/30 text-sm">Max 2 goals — you're set!</div>
            )}

            <div className="flex gap-3 mt-4">
              <button onClick={()=>setStep('name')} className="px-4 py-2.5 rounded-xl text-sm text-white/50" style={{ background:'rgba(255,255,255,0.08)' }}>← Back</button>
              <button onClick={finish} disabled={goals.length===0}
                className="flex-1 py-3 rounded-xl font-black text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition-transform active:scale-95"
                style={{ background:goals.length>0?'#f9c923':'rgba(255,255,255,0.2)', color:'#1a1a1a', fontFamily:'Oswald', letterSpacing:'0.05em' }}>
                ⚽ KICK OFF!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
