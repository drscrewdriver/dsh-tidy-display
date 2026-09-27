import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { ChatSnapshot } from '@deepseek-ai/dsh-client-ui-chat/client';
import { ChoreographedFlow, useFlowChat } from '../src/client/ChoreographedFlow.js';
import { presentLiveTurn } from '../src/client/live-turn.js';
import type { LiveStep } from '../src/client/live-turn.js';
import { Disclosure, StatusText, useMotionAllowed, useReadingScroll } from '../src/client/motion.js';
import { ReasoningCard } from '../src/client/ReasoningCard.js';
import { StreamMotionContext, useStreamingText } from '../src/client/streaming.js';
import css from '../src/client/Reader.module.css';

const sample = '旧内容保持原位，先完成连续收拢，再确认数字，最后继续输出。This is a real component regression fixture, not a replacement animation. ';
function Text({ step }: { step: LiveStep }) {
  const node = useFlowChat(s => 'nodeKey' in step ? s.nodes.get(step.nodeKey) : undefined);
  const source = (node?.data as { text?: string })?.text ?? '';
  const text = useStreamingText(source, true, { startedAt: 0, interrupted: false, selected: false });
  if (step.kind === 'reasoning') return <ReasoningCard step={step.step} active motion selected={false} onRead={() => {}}>
    <div data-test-text={step.key} style={{ whiteSpace: 'pre-wrap' }}>{text.text}</div>
  </ReasoningCard>;
  return <div data-reader-anchor style={{ padding: '10px 0' }} data-test-text={step.key}>{step.kind === 'body' ? sample : '工具 · 读取源文件，等待下一个步骤'}</div>;
}
function Demo() {
  const [n, setN] = useState(1);
  const [tail, setTail] = useState(0);
  const [auto, setAuto] = useState(true);
  const [motionSetting, setMotion] = useState(true);
  const motion = useMotionAllowed(motionSetting);
  const [urgent, setUrgent] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const root = useRef<HTMLDivElement>(null); const button=useRef<HTMLButtonElement>(null);
  useReadingScroll(root, motion);
  const frame = useMemo(() => {
    const steps: LiveStep[] = [];
    const nodes = new Map();
    for (let i=1; i<=n; i++) {
      steps.push({ kind: 'reasoning', key: `r${i}`, nodeKey:`r${i}`, start:0, blocks:[], step:i });
      nodes.set(`r${i}`, { data: { text: sample.repeat(i===n && n>1 ? 3 + tail : 5) } });
      if (i<n || n===1) {
        steps.push({kind:'body',key:`b${i}`,nodeKey:`b${i}`,start:1,blocks:[],step:i});
        steps.push({kind:'other',key:`t${i}`,nodeKey:`t${i}`});
      }
    }
    return {items:presentLiveTurn(steps,{status:'open'},auto),snapshot:{nodes:{get:(key:string)=>nodes.get(key)}} as unknown as ChatSnapshot};
  }, [n,tail,auto]);
  (window as any).fixture = { next:()=>setN(v=>v+1), burst:()=>{setN(v=>v+1); setTimeout(()=>setN(v=>v+2),100); setTimeout(()=>setTail(v=>v+2),180);}, stop:()=>setUrgent(true), reduce:()=>setMotion(false), reset:()=>{setN(1);setTail(0);setUrgent(false);setOpen({});setMotion(true);setAuto(true);} };
  return <><nav style={{padding:12,display:'flex',gap:12,flexWrap:'wrap'}}>
    <b>转场验收 · 真实组件 / 模拟数据</b>
    <button onClick={()=>(window as any).fixture.next()}>下一步</button>
    <button onClick={()=>(window as any).fixture.burst()}>突发三步</button>
    <button onClick={()=>(window as any).fixture.stop()}>停止</button>
    <button onClick={()=>(window as any).fixture.reset()}>重置</button>
    <button onClick={()=>setMotion(v=>!v)}>动效{motion?'开':'关'}</button>
  </nav><div data-conversation-scroll style={{height:'calc(100vh - 70px)',overflow:'auto'}}>
    <StreamMotionContext.Provider value={{enabled:motion,activatedAt:Date.now()}}>
    <div ref={root} className={css.root} data-motion={motion?'on':'off'}><div className={css.column} data-chat-flow="">
      <div className={css.toolbar}><button className={css.textButton} onClick={()=>setAuto(v=>!v)}>自动折叠{auto?'开':'关'}</button></div>
      <div className={css.turnProcessSticky}><Disclosure open={expanded} onChange={setExpanded} buttonRef={button} label={<StatusText text="正在处理" motion={motion}/>} /></div>
      <ChoreographedFlow id="fixture-flow" frame={frame} motion={motion} enabled={auto} urgent={urgent} processOpen={expanded}
        open={open} onOpenChange={(key,value)=>setOpen(s=>({...s,[key]:value}))} renderStep={step=><Text step={step}/>} />
      <div data-test-footer style={{height:72}}>输入区位置参照 · 后台数据不会被修改</div>
    </div></div></StreamMotionContext.Provider>
  </div></>;
}
createRoot(document.getElementById('app')!).render(<Demo />);
