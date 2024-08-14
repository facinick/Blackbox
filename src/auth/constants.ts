export const ACCESS_TOKEN_COOKIE_KEY = 'accessToken'
export const REFRESH_TOKEN_COOKIE_KEY = 'refreshToken'
export const JWT_COOKIE_SETTINGS = {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: true
}