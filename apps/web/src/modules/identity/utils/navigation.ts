export interface RedirectLocationState {
  pathname?: string;
  search?: string;
  hash?: string;
}

const AUTH_LOOP_PATHS = new Set(['/login', '/register']);

/**
 * Validates a redirect target so only safe internal relative paths are allowed.
 * Prevents open-redirect vulnerabilities such as external URLs or protocol-relative paths,
 * as well as auth redirect loops back to /login or /register.
 */
export function getSafeRedirectPath(
  nextParam: string | null | undefined,
  fallback = '/'
): string {
  if (!nextParam) {
    return fallback;
  }

  const trimmed = nextParam.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmed, 'https://autodock.local');
    if (parsed.origin !== 'https://autodock.local') {
      return fallback;
    }
    const normalizedPath = parsed.pathname.replace(/\/+$/, '') || '/';
    if (AUTH_LOOP_PATHS.has(normalizedPath)) {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

/**
 * Resolves a safe redirect target by preferring `?next=` first, then `location.state.from`.
 */
export function getSafeRedirectTarget(
  rawNext: string | null | undefined,
  fallbackStateFrom?: RedirectLocationState | null,
  fallback = '/'
): string {
  const safeNext = getSafeRedirectPath(rawNext, '');
  if (safeNext) {
    return safeNext;
  }

  if (fallbackStateFrom?.pathname) {
    const stateTarget = `${fallbackStateFrom.pathname}${fallbackStateFrom.search || ''}${fallbackStateFrom.hash || ''}`;
    return getSafeRedirectPath(stateTarget, fallback);
  }

  return fallback;
}

export function buildAuthPathWithNext(
  authPath: '/login' | '/register',
  nextPath: string | null | undefined
): string {
  const safeNext = getSafeRedirectPath(nextPath, '');
  if (!safeNext) {
    return authPath;
  }
  return `${authPath}?next=${encodeURIComponent(safeNext)}`;
}
