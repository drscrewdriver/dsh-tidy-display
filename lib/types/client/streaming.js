import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StreamBuffer } from './stream-buffer.js';
import { WORD_MOTION } from './word-timeline.js';
export const StreamMotionContext = createContext({ enabled: false, activatedAt: 0 });
export function useStreamingText(source, streaming, options) {
    const { enabled, activatedAt, paused = false, resumed = false } = useContext(StreamMotionContext);
    const fresh = resumed || (options.startedAt ?? 0) >= activatedAt;
    const buffer = useRef();
    // Only newly mounted content after a fold uses the catch-up path. History and
    // user-opened drawers stay immediate; already mounted prefixes never replay.
    if (!buffer.current)
        buffer.current = new StreamBuffer(enabled && (streaming || resumed) && fresh ? '' : source);
    const [display, setDisplay] = useState(() => ({ text: buffer.current.visible, revision: 0 }));
    const [finalizing, setFinalizing] = useState(streaming);
    const frame = useRef(0);
    const immediate = !enabled || options.interrupted || options.selected;
    const publish = () => {
        const current = buffer.current;
        setDisplay(previous => previous.text === current.visible && previous.revision === current.revision ? previous : { text: current.visible, revision: current.revision });
    };
    const handoff = useRef(resumed);
    const presentationClock = useRef(performance.now());
    useLayoutEffect(() => {
        cancelAnimationFrame(frame.current);
        const current = buffer.current;
        // While the choreography holds the reveal, keep the buffer absorbing the
        // source instead of returning early: the target must never lag behind what
        // arrived, or the text would keep catching up long after the fold settled.
        // Dropping the frame loop is what pauses the reveal; the target still tracks.
        if (paused && !immediate && !document.hidden) {
            current.update(source, performance.now(), { immediate: false, finished: !streaming });
            publish();
            return;
        }
        let previous = performance.now();
        current.update(source, handoff.current ? presentationClock.current : previous, { immediate: immediate || document.hidden, finished: !streaming && !resumed });
        publish();
        const tick = (now) => {
            // A delayed browser frame must not dump the whole buffered response at
            // first paint. Bound catch-up by visible frame time for this handoff only.
            presentationClock.current += Math.min(32, Math.max(0, now - previous));
            previous = now;
            if (document.hidden)
                current.flush();
            else
                current.advance(handoff.current ? presentationClock.current : now);
            publish();
            if (current.pending)
                frame.current = requestAnimationFrame(tick);
            else
                handoff.current = false;
        };
        if (current.pending)
            frame.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame.current);
    }, [source, streaming, immediate, paused, resumed]);
    useEffect(() => {
        const hidden = () => {
            if (!document.hidden)
                return;
            cancelAnimationFrame(frame.current);
            buffer.current.flush();
            publish();
            setFinalizing(false);
        };
        document.addEventListener('visibilitychange', hidden);
        return () => document.removeEventListener('visibilitychange', hidden);
    }, []);
    const pending = display.text !== source;
    useEffect(() => {
        if (streaming || pending) {
            setFinalizing(true);
            return;
        }
        if (immediate || document.hidden) {
            setFinalizing(false);
            return;
        }
        const timer = setTimeout(() => setFinalizing(false), WORD_MOTION.duration + WORD_MOTION.maxDelay);
        return () => clearTimeout(timer);
    }, [streaming, pending, immediate]);
    return { text: immediate ? source : display.text, pending: !immediate && pending, revision: display.revision, formatStreaming: streaming || (!immediate && (pending || finalizing)), reveal: enabled && !options.interrupted && !options.selected };
}
//# sourceMappingURL=streaming.js.map