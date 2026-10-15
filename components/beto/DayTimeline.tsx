'use client';
import {motion} from 'framer-motion';
import {Check,LockKeyhole} from 'lucide-react';
export function DayTimeline({steps}:{steps:{label:string,done:boolean,detail:string}[]}){return <ol className="daytimeline" aria-label="Processos do dia">{steps.map((step,i)=><li key={step.label} className={step.done?'done':steps.slice(0,i).every(s=>s.done)?'current':''}><motion.span layout className="timelinepoint">{step.done?<Check size={15}/>:i+1}</motion.span><div><strong>{step.label}</strong><small>{step.detail}</small></div></li>)}</ol>;}
