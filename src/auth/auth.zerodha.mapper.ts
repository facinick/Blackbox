import { KiteConnect } from 'kiteconnect'
import { OAuthSession } from './auth'

export const AuthMapper = {

  Session: {
    toDomain: (session: Awaited<ReturnType<KiteConnect['generateSession']>>): OAuthSession => {
      return {
        accessToken: session.access_token,
        userId: session.user_id,
        refreshToken: session.refresh_token
      }
    },
  },
}
