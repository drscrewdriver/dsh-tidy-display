/**
 * GenUI inline-fence plate.
 *
 * The GenUI DOM channel mounts each inline card in a container with the plain
 * (non-hashed) class `genui-dom-fence` next to the hidden stock fence. The
 * card itself ships no canvas by design — it leaned on the host message
 * bubble's background. When a foreign renderer (e.g. a raw-html takeover)
 * routes the fence outside that bubble, the card's text floats directly on
 * the wallpaper. Keying a plate to the mount root follows the card no matter
 * who rendered the fence around it.
 *
 * Same three-layer anti-collapse floor as the Reader answer bubble (see
 * Reader.module.css `.root[data-reader-bubbles=on] .answer`): a theme-aware
 * page-base scrim + an always-on neutral tint as background-images over the
 * skin's layer-1 color, so a skin that zeroes the token cannot erase it.
 *
 * Inside a Reader answer the bubble already carries the plate, so the card
 * stays flat there (`[data-reader-answer]` is the stable hook).
 */
let injected = false;
export function ensureGenuiPlateCss() {
    if (injected || typeof document === 'undefined')
        return;
    injected = true;
    const style = document.createElement('style');
    style.textContent = `
.genui-dom-fence {
  box-sizing: border-box;
  background:
    linear-gradient(color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 76%, transparent), color-mix(in srgb, var(--dsw-alias-bg-base, #fff) 76%, transparent)),
    linear-gradient(rgba(127, 127, 127, .10), rgba(127, 127, 127, .10));
  background-color: var(--dsw-alias-bg-layer-1, rgba(127, 127, 127, .08));
  border: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, .22));
  border-radius: 12px;
  padding: 10px 14px;
  margin: 8px 0;
}
[data-reader-answer] .genui-dom-fence {
  background: none;
  background-color: transparent;
  border: none;
  padding: 0;
  margin: 0;
}
`;
    document.head.appendChild(style);
}
//# sourceMappingURL=genui-plate.js.map