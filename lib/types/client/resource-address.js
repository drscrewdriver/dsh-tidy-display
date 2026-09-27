/**
 * The `dsh-resource://file/…` address the right-hand panel opens by.
 *
 * The workspace-path helper that builds this is not exported by every version
 * of the package this plugin compiles against, so the grammar is spelled out
 * here: a path inside the Session's workspace is addressed by its
 * workspace-relative spelling, and one outside it keeps its absolute path.
 */
const PREFIX = 'dsh-resource://file/';
/** One id or path segment, keeping `:` so a drive letter stays readable. */
function encodeSegment(segment) {
    return encodeURIComponent(segment).replace(/%3A/gi, ':');
}
function encodePath(path) {
    return path.split('/').map(encodeSegment).join('/');
}
function isAbsolute(path) {
    return path.startsWith('/') || /^[A-Za-z]:\//.test(path);
}
/** Address one file for the given Session, relative to that Session's workspace. */
export function fileResourceAddress(sessionId, cwd, path) {
    const normalized = path.replace(/\\/g, '/');
    let relative = normalized;
    if (isAbsolute(normalized) && cwd) {
        const root = cwd.replace(/\\/g, '/').replace(/\/+$/, '');
        if (root !== '' && normalized === root)
            relative = '';
        else if (root !== '' && normalized.startsWith(`${root}/`))
            relative = normalized.slice(root.length + 1);
    }
    return `${PREFIX}session/${encodeSegment(sessionId)}/${encodePath(relative)}`;
}
//# sourceMappingURL=resource-address.js.map