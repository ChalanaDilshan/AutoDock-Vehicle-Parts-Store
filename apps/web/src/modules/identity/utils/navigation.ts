/**
 * Validates a redirect target so only safe internal relative paths are allowed.
 * Prevents open-redirect vulnerabilities such as external URLs or protocol-relative paths.
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
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
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
