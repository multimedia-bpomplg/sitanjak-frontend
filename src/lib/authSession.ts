export interface JwtTokenPayload {
  id?: string;
  name?: string;
  nama?: string;
  email?: string;
  roles?: string[];
  avatar?: string;
  jurusan?: string;
  kategoriMagang?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

const DEFAULT_COOKIE_MAX_AGE_SECONDS = 86400; // 1 day fallback

/**
 * Safely decodes the payload segment of a JWT (supports base64url encoding).
 */
export function parseJwtPayload(token: string): JwtTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2 || !parts[1]) return null;

    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) {
      base64 += "=";
    }

    const jsonStr = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonStr) as JwtTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Checks whether a JWT is malformed or already expired.
 */
export function isJwtExpired(token: string, skewSeconds = 0): boolean {
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") {
    return true;
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSeconds + skewSeconds;
}

/**
 * Returns remaining JWT lifetime in seconds based on `exp`, or 0 if invalid/expired.
 */
export function getJwtRemainingSeconds(token: string): number {
  const payload = parseJwtPayload(token);
  if (!payload) return 0;
  if (typeof payload.exp !== "number") {
    return DEFAULT_COOKIE_MAX_AGE_SECONDS;
  }
  const remaining = payload.exp - Math.floor(Date.now() / 1000);
  return remaining > 0 ? remaining : 0;
}

/**
 * Persists `token` and `roles` cookies with explicit `max-age` matching JWT expiry
 * so sessions survive browser/app restarts instead of behaving as session-only cookies.
 */
export function persistAuthCookies(token: string, roles: string[] = []): void {
  if (typeof document === "undefined") return;

  const remainingSeconds = getJwtRemainingSeconds(token);
  const maxAge =
    remainingSeconds > 0 ? remainingSeconds : DEFAULT_COOKIE_MAX_AGE_SECONDS;
  const secureFlag =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";

  const encodedRoles = encodeURIComponent(JSON.stringify(roles));
  document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
  document.cookie = `roles=${encodedRoles}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
}

/**
 * Reads whether a specific cookie key currently exists in `document.cookie`.
 */
export function hasBrowserCookie(name: string): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((part) => part.trim().startsWith(`${name}=`));
}

/**
 * Clears auth credentials from both `localStorage` and `document.cookie`.
 */
export function clearAuthSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("roles");
    localStorage.removeItem("user");
  }

  if (typeof document !== "undefined") {
    const secureFlag =
      typeof window !== "undefined" && window.location.protocol === "https:"
        ? "; Secure"
        : "";
    document.cookie = `token=; path=/; max-age=0; SameSite=Lax${secureFlag}`;
    document.cookie = `roles=; path=/; max-age=0; SameSite=Lax${secureFlag}`;
  }
}
