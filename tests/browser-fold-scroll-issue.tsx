import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StickyLane } from '../src/client/StickyLane.js';
import { Disclosure } from '../src/client/motion.js';
import css from '../src/client/Reader.module.css';

/** Mirrors the user report: a closed turn whose long answer is read mid-scroll. */
function Fixture() {
  const [expanded, setExpanded] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const button2 = useRef<HTMLButtonElement>(null);
  return <div data-conversation-scroll id="scrollport" style={{ height: 'calc(100vh - 32px)', overflow: 'auto' }}>
    <div className={css.root} data-dsh-tidy-display="fixture">
      <div className={css.column} data-chat-flow="">
        <StickyLane kind="toolbar" className={css.toolbar}>
          <button className={css.textButton}>自动折叠开</button>
        </StickyLane>
        <section className={css.turn} data-reader-turn="1">
          <div style={{ height: 120, background: '#eef2ff', alignSelf: 'flex-end', width: '65%' }}>用户消息</div>
          <StickyLane kind="status" className={css.turnProcessSticky}>
            <Disclosure open={expanded} onChange={setExpanded} buttonRef={button} label={<span>用时 4 分 1 秒</span>} />
          </StickyLane>
          <div className={css.closedProcessSummary} data-reader-closed-summary="思考×15 · 输出×1 · 工具×22 · 记录×1">
            <div className={css.summaryRow}>
              <Disclosure open={expanded} onChange={setExpanded} controls="body" buttonRef={button2} ariaLabel="过程详情"
                label={<span>思考×15·输出×1·工具×22·记录×1</span>} />
            </div>
          </div>
          <div id="body" data-reader-answer style={{ padding: '8px 0' }}>
            {Array.from({ length: 40 }, (_, i) => (
              <div key={i} style={{ padding: '6px 0 6px 40px', borderBottom: '1px solid #eee' }}>
                回答正文行 {i} —— .agent-presets/standard-win/ ⚠ 必须改 硬编码了 linux 绝对路径
              </div>
            ))}
          </div>
        </section>
        <section className={css.turn} data-reader-turn="2" style={{ paddingTop: 20 }}>
          <div style={{ height: 400, background: '#f2fff2' }}>下一轮内容占位</div>
        </section>
      </div>
    </div>
  </div>;
}

createRoot(document.getElementById('app')!).render(<Fixture />);
