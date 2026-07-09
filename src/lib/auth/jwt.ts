import jwt from 'jsonwebtoken'

export interface TokenPayload {
  id: string
  email?: string
  role?: string
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(
    { id: payload.id, email: payload.email, role: payload.role },
    process.env.STAFF_ACCESS_TOKEN_SECRET!,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY as any }
  )
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(
    { id: payload.id },
    process.env.STAFF_REFRESH_TOKEN_SECRET!,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY as any }
  )
}

export function generateOtpToken(payload: TokenPayload): string {
  return jwt.sign(
    { id: payload.id },
    process.env.OTP_TOKEN_SECRET!,
    { expiresIn: process.env.OTP_TOKEN_EXPIRY as any }
  )
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, process.env.STAFF_ACCESS_TOKEN_SECRET!) as TokenPayload
  } catch (error) {
    throw new Error('Invalid or expired access token')
  }
}

export function verifyRefreshToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, process.env.STAFF_REFRESH_TOKEN_SECRET!) as TokenPayload
  } catch (error) {
    throw new Error('Invalid or expired refresh token')
  }
}

export function verifyOtpToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, process.env.OTP_TOKEN_SECRET!) as TokenPayload
  } catch (error) {
    throw new Error('Invalid or expired OTP token')
  }
}