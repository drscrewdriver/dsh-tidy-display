import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { ChatSnapshot } from '@deepseek-ai/dsh-client-ui-chat/client';
import { ChoreographedFlow } from '../src/client/ChoreographedFlow.js';
import { ClosedProcessSummary } from '../src/client/ClosedProcessSummary.js';
import { ProcessFragment } from '../src/client/motion.js';
import { presentLiveTurn } from '../src/client/live-turn.js';
import type { LiveStep } from '../src/client/live-turn.js';
function Fixture() {
 const [open,setOpen]=useState(false);const button=useRef<HTMLButtonElement>(null);
 const steps=useMemo(()=>Array.from({length:500},(_,i):LiveStep=>({kind:'reasoning',key:`r${i}`,nodeKey:`r${i}`,step:i,start:0,blocks:[]})),[]);
 const frame=useMemo(()=>({items:presentLiveTurn(steps,{status:'closed',reason:'completed',closingStep:501,latestStep:501}),snapshot:{} as ChatSnapshot}),[steps]);
 return <main style={{padding:30}}><h1>完成后 500 条过程记录：实际组件回归</h1>
 <button ref={button} onClick={()=>setOpen(v=>!v)}>切换过程展开</button>
 <ClosedProcessSummary steps={steps} open={open} onChange={setOpen} controls="closed-flow"/>
 <ChoreographedFlow id="closed-flow" frame={frame} motion enabled={false} urgent={false} processOpen={open} open={{}} onOpenChange={()=>{}}
 renderStep={step=><ProcessFragment open={open} motion onRead={()=>{}} returnFocusTo={button} nodeKey={step.key}><p>过程内容 {step.key}</p></ProcessFragment>}/>
 <article data-final-answer>最终回答必须紧随统计，不能隔着 8000px 空白；展开、收起以后仍应如此。</article></main>;
}
createRoot(document.getElementById('app')!).render(<Fixture/>);
