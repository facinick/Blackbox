import { OAuthSession } from "./auth";

export interface AuthApiPort {
  generateSession: (...args: any) => Promise<OAuthSession>
  setSessionExpiryHook: (onSessionExpiry: () => void) => void
}
