/**
 * Resolves a post-auth redirect to an in-app pathname.
 * React Router `navigate()` treats non-leading-slash strings as relative paths,
 * so full URLs like `http://localhost:5173` must be normalized to `/`.
 */
export function resolvePostAuthRedirect(redirectParam: string | null): string {
  const fallback = '/';
  if (!redirectParam?.trim()) return fallback;

  const trimmed = redirectParam.trim();

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (url.origin !== window.location.origin) return fallback;
    const path = `${url.pathname}${url.search}${url.hash}`;
    return path.startsWith('/') ? path || fallback : fallback;
  } catch {
    return fallback;
  }
}
