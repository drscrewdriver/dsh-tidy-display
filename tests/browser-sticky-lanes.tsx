import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { ChatSnapshot } from '@deepseek-ai/dsh-client-ui-chat/client';
import { StickyLane } from '../src/client/StickyLane.js';
import { ChoreographedFlow } from '../src/client/ChoreographedFlow.js';
import { ClosedProcessSummary } from '../src/client/ClosedProcessSummary.js';
import { Disclosure, StatusText } from '../src/client/motion.js';
import { presentLiveTurn } from '../src/client/live-turn.js';
import type { LiveStep } from '../src/client/live-turn.js';
import css from '../src/client/Reader.module.css';
const steps:LiveStep[]=[...Array.from({length:6},(_,i):LiveStep=>({kind:'reasoning',key:`r${i}`,nodeKey:`r${i}`,step:i,start:0,blocks:[]})),{kind:'body',key:'body',nodeKey:'body',step:6,start:0,blocks:[]},{kind:'other',key:'extra',nodeKey:'extra'},{kind:'reasoning',key:'latest',nodeKey:'latest',step:7,start:0,blocks:[]},{kind:'body',key:'answer',nodeKey:'answer',step:7,start:0,blocks:[]}];
function Fixture(){
 const [expanded,setExpanded]=useState(true),[open,setOpen]=useState<Record<string,boolean>>({}),[closed,setClosed]=useState(false);const button=useRef<HTMLButtonElement>(null);
 const frame=useMemo(()=>({items:presentLiveTurn(steps,{status:'open',reason:null,latestStep:7,closingStep:null}),snapshot:{} as ChatSnapshot}),[]);
 return <><button onClick={()=>setClosed(v=>!v)}>切换完成状态</button><div data-conversation-scroll style={{height:'calc(100vh - 32px)',overflow:'auto'}}><div className={css.root} data-dsh-tidy-display="fixture"><div className={css.column} data-chat-flow="">
 <StickyLane kind="toolbar" className={css.toolbar}><button className={css.textButton}>自动折叠开</button></StickyLane>
 <section className={css.turn} data-reader-turn="1"><div style={{height:240,background:'#eef2ff',alignSelf:'flex-end',width:'65%'}}>用户消息：滚动抵达顶部才吸顶。</div>
 <StickyLane kind="status" className={css.turnProcessSticky}><Disclosure open={expanded} onChange={setExpanded} buttonRef={button} label={<StatusText text="正在使用工具" motion={false}/>} /></StickyLane>
 {closed?<><ClosedProcessSummary steps={steps.slice(0,-1)} open={expanded} onChange={setExpanded} controls="body"/><div id="body" style={{height:1600}}>最终回答占位，验证完成后统计仍然吸顶。</div></>:<ChoreographedFlow id="flow" frame={frame} motion={false} enabled={false} urgent={false} processOpen={expanded} open={open} onOpenChange={(k,v)=>{setExpanded(true);setOpen(x=>({...x,[k]:v}));}} renderStep={s=>s.key==='answer'?<div style={{height:1600}}>当前输出保持完整，统计不应被推出视野。</div>:expanded?<div style={{height:s.key==='latest'?300:100}}>过程 {s.key}</div>:null}/>}
 </section><div style={{height:180}}>下一轮之前</div></div></div></div></>;
}
createRoot(document.getElementById('app')!).render(<Fixture/>);
