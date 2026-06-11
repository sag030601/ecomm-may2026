import type { Location } from 'react-router-dom';

const STORAGE_KEY = 'auth-intended-route';

const BLOCKED_PREFIXES = ['/login', '/register', '/auth/callback'];

/** Minimal route snapshot stored in login/register navigation state. */
export type AuthRedirectLocation = {
  pathname: string;
  search?: string;
  hash?: string;
};

export type AuthLocationState = {
  from?: AuthRedirectLocation;
};

export function getAuthLocationState(location: { state: unknown }): AuthLocationState | null {
  if (!location.state || typeof location.state !== 'object') {
    return null;
  }
  const state = location.state as AuthLocationState;
  if (!state.from || typeof state.from.pathname !== 'string') {
    return null;
  }
  return { from: state.from };
}

export function locationToPath(location: AuthRedirectLocation): string {
  return `${location.pathname}${location.search ?? ''}${location.hash ?? ''}`;
}

export function saveIntendedRoute(locationOrPath: Location | string): void {
  const path = typeof locationOrPath === 'string' ? locationOrPath : locationToPath(locationOrPath);
  if (!path.startsWith('/') || BLOCKED_PREFIXES.some((p) => path.startsWith(p))) return;
  sessionStorage.setItem(STORAGE_KEY, path);
}

export function peekIntendedRoute(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function getAndClearIntendedRoute(): string {
  const path = sessionStorage.getItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  if (path?.startsWith('/') && !BLOCKED_PREFIXES.some((p) => path.startsWith(p))) {
    return path;
  }
  return '/';
}

export function resolveLoginReturnPath(locationState: AuthLocationState | null): string {
  if (locationState?.from) {
    return locationToPath(locationState.from);
  }
  return peekIntendedRoute() || '/';
}
