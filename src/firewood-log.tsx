import { useEffect, useMemo, useState } from "react";
import { Flame, Plus, Trash2, TreeDeciduous } from "lucide-react";

type Species = { id: string; name: string; months: number; early?: number };
type Burn = { id: string; date: string; amount: number; heat: number };
type Stack = { id: string; species: string; cut: string; split: string; quantity: number; original: number; unit: "cord" | "face"; burns: Burn[] };

const SPECIES: Species[] = [
  { id: "oak", name: "Oak", months: 12 }, { id: "hickory", name: "Hickory", months: 12 },
  { id: "hedge", name: "Osage orange (hedge)", months: 12 }, { id: "locust", name: "Locust", months: 12, early: 6 },
  { id: "walnut", name: "Walnut", months: 12 }, { id: "maple", name: "Maple", months: 9, early: 6 },
  { id: "ash", name: "Ash", months: 9, early: 6 }, { id: "elm", name: "Elm", months: 12 },
  { id: "hackberry", name: "Hackberry", months: 12 }, { id: "mulberry", name: "Mulberry", months: 12 },
  { id: "cherry", name: "Cherry", months: 12 }, { id: "cottonwood", name: "Cottonwood", months: 6 },
  { id: "cedar", name: "Red cedar", months: 6 }, { id: "pine", name: "Pine", months: 6 },
  { id: "birch", name: "Birch", months: 6 }, { id: "other", name: "Other", months: 12 },
];
const KEY = "firewood-log.v2";
const today = () => new Date().toISOString().slice(0, 10);
const dateText = (s: string) => new Date(`${s}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const addMonths = (s: string, n: number) => { const d = new Date(`${s}T12:00:00`); const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(day, last)); return d.toISOString().slice(0, 10); };
const days = (a: string, b: string) => Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86400000);
const id = () => crypto.randomUUID();
const spec = (id: string) => SPECIES.find(s => s.id === id)!;
const fmt = (n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Math.round(n * 100) / 100);

function readiness(stack: Stack) {
  const s = spec(stack.species); const start = stack.split || stack.cut; const ready = addMonths(start, s.months); const early = s.early ? addMonths(start, s.early) : null;
  const now = today(); const total = Math.max(1, days(start, ready)); const elapsed = days(start, now);
  const status = now >= ready ? "ready" : early && now >= early ? "window" : now < start ? "waiting" : "seasoning";
  const progress = status === "ready" ? 100 : status === "waiting" ? 0 : Math.max(0, Math.min(100, elapsed / total * 100));
  return { ready, early, status, progress };
}

export function FirewoodLog() {
  const [stacks, setStacks] = useState<Stack[]>(() => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } });
  const [species, setSpecies] = useState("oak"); const [cut, setCut] = useState(today()); const [split, setSplit] = useState(today()); const [qty, setQty] = useState(""); const [unit, setUnit] = useState<"cord" | "face">("cord");
  const [error, setError] = useState("");
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(stacks)), [stacks]);
  const inventory = useMemo(() => ({ cords: stacks.filter(s => s.unit === "cord").reduce((n,s) => n+s.quantity,0), face: stacks.filter(s => s.unit === "face").reduce((n,s) => n+s.quantity,0), ready: stacks.filter(s => s.quantity > 0 && readiness(s).status === "ready").length }), [stacks]);
  const totalFires = stacks.reduce((n,s) => n+s.burns.length,0);
  function addStack(e: React.FormEvent) { e.preventDefault(); const n=Number(qty); if (!cut || !split || split < cut) return setError("Split date cannot be before the cut date."); if (!Number.isFinite(n)||n<=0) return setError("Enter a quantity greater than zero."); setStacks([{id:id(),species,cut,split,quantity:n,original:n,unit,burns:[]},...stacks]); setQty(""); setError(""); }
  function sample() { const d=today(); setStacks([{id:id(),species:"oak",cut:addMonths(d,-7),split:addMonths(d,-6),quantity:1,original:1,unit:"cord",burns:[]},{id:id(),species:"maple",cut:addMonths(d,-3),split:addMonths(d,-2),quantity:.5,original:.5,unit:"face",burns:[]}]); }
  function burn(stack: Stack) { const amount=Number(prompt(`How much ${stack.unit} did you burn?\nRemaining: ${fmt(stack.quantity)}`)); if (!Number.isFinite(amount)||amount<=0||amount>stack.quantity) return; const h=Number(prompt("Heat rating, 1–5")); if (![1,2,3,4,5].includes(h)) return; setStacks(stacks.map(s=>s.id===stack.id?{...s,quantity:Math.max(0,Math.round((s.quantity-amount)*100)/100),burns:[...s.burns,{id:id(),date:today(),amount,heat:h}]}:s)); }
  return <main className="app"><header className="header"><div className="brand"><span className="logo"><Flame size={24}/></span><div><h1>Firewood Log</h1><p>Track split dates, seasoning, inventory, and burns.</p></div></div></header>
    <section className="stats"><article><span>On hand</span><strong>{fmt(inventory.cords)} <small>cord</small></strong><em>{fmt(inventory.face)} face</em></article><article><span>Ready</span><strong>{inventory.ready}</strong><em>stacks</em></article><article><span>Fires logged</span><strong>{totalFires}</strong><em>ratings</em></article></section>
    <section className="panel"><h2>Add a stack</h2><form onSubmit={addStack} className="form"><label>Species<select value={species} onChange={e=>setSpecies(e.target.value)}>{SPECIES.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Cut date<input type="date" value={cut} onChange={e=>setCut(e.target.value)} max={today()}/></label><label>Split date<input type="date" value={split} onChange={e=>setSplit(e.target.value)} max={today()}/></label><label>Quantity<input type="number" min="0.01" step="0.01" value={qty} onChange={e=>setQty(e.target.value)} placeholder="0.5"/></label><label>Unit<select value={unit} onChange={e=>setUnit(e.target.value as "cord"|"face")}><option value="cord">Cord</option><option value="face">Face cord</option></select></label><button className="primary" type="submit"><Plus size={18}/> Add stack</button></form>{error&&<p className="error">{error}</p>}</section>
    <section><div className="section-title"><h2>Stacks</h2>{stacks.length===0&&<button className="secondary" onClick={sample}>Load sample</button>}</div>{stacks.length===0?<div className="empty"><TreeDeciduous size={34}/><h3>No stacks yet</h3><p>Add a stack above. Your data stays in this browser.</p></div>:<div className="stacks">{stacks.map(s=><StackCard key={s.id} stack={s} onBurn={()=>burn(s)} onRemove={()=>setStacks(stacks.filter(x=>x.id!==s.id))}/>)}</div>}</section>
    <section className="panel summary"><h2>By species</h2>{SPECIES.filter(sp=>stacks.some(s=>s.species===sp.id)).map(sp=>{const rows=stacks.filter(s=>s.species===sp.id);const amount=rows.reduce((n,s)=>n+s.quantity,0);const fires=rows.reduce((n,s)=>n+s.burns.length,0);const heats=rows.flatMap(s=>s.burns.map(b=>b.heat));return <div className="row" key={sp.id}><span>{sp.name}</span><strong>{fmt(amount)} {rows[0].unit}{fires?` · ${heats.reduce((a,b)=>a+b,0)/heats.length.toFixed?.(1)}`:""}</strong></div>})}</section>
    <footer>Saved locally on this device. No account required.</footer>
  </main>;
}

function StackCard({stack,onBurn,onRemove}:{stack:Stack;onBurn:()=>void;onRemove:()=>void}) { const s=spec(stack.species), r=readiness(stack); const remaining=Math.max(0,days(today(),r.ready)); const status=r.status==="ready"?"Ready":r.status==="window"?"Burn window":r.status==="waiting"?"Not started":"Seasoning"; return <article className="stack"><div className="stack-head"><div><h3>{s.name}</h3><p>{fmt(stack.quantity)} {stack.unit}{stack.quantity!==stack.original&&` · of ${fmt(stack.original)}`}</p></div><span className={`pill ${r.status}`}>{status}</span></div><p className="dates">Cut {dateText(stack.cut)} · Split {dateText(stack.split)}</p><div className="bar"><span style={{width:`${r.progress}%`}}/></div><div className="range"><span>{r.status==="ready"?"Ready now":`${remaining} days until ready`}</span><span>{dateText(r.ready)}</span></div><div className="actions">{stack.quantity>0&&<button className="primary" onClick={onBurn}><Flame size={17}/> Log burn</button>}<button className="danger" onClick={()=>{if(confirm(`Remove the ${s.name} stack?`))onRemove()}}><Trash2 size={17}/> Remove</button></div>{stack.burns.length>0&&<div className="burns">{[...stack.burns].reverse().map(b=><span key={b.id}>{dateText(b.date)} · {fmt(b.amount)} {stack.unit} · heat {b.heat}/5</span>)}</div>}</article>; }
