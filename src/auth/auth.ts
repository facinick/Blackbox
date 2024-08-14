export interface OAuthSession {
    accessToken: string
    refreshToken?: string
    userId: string
}

export interface AuthPayload {
    sub: string
    iat?: number
    exp?: number
}