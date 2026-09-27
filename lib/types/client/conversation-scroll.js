/**
 * Conversation-column scroll helpers. Official ChatView lands Turns by writing
 * the enclosing `[data-conversation-scroll]` box; `Element.scrollIntoView`
 * also walks ancestor scrollers and can lift the sticky composer off the
 * bottom of the viewport (rail jump to top, then to bottom).
 */
/** Reading-line offset used by ui-chat ChatView.landOnRow. */
export const READING_LINE_OFFSET_PX = 24;
/** Active column host when present; otherwise the view-local scroller. */
export function scrollerOf(from) {
    return from.closest('[data-conversation-scroll]') ?? from;
}
/** Row position in scrollport coordinates (viewport-independent). */
export function flowTop(row, scrollport) {
    return row.getBoundingClientRect().top - scrollport.getBoundingClientRect().top;
}
/**
 * Place `row` on the conversation scroller only. Never calls scrollIntoView.
 * @param row - a rendered `[data-reader-turn]` row.
 * @param scrollport - `scrollerOf` of the reader root.
 */
export function landTurn(row, scrollport, offsetPx = READING_LINE_OFFSET_PX) {
    scrollport.scrollTop += flowTop(row, scrollport) - offsetPx;
}
//# sourceMappingURL=conversation-scroll.js.map