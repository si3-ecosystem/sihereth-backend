import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface TokenPayload {
  id: string
  email: string
  name: string
  iat?: number
  exp?: number
}

/**
 * Authentication middleware: verifies JWT in cookies and populates req.user
 */
const auth = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  try {
    const token = req.cookies?.token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing'
      })
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as TokenPayload

    req.user = {
      id:    decoded.id,
      email: decoded.email,
      name:  decoded.name
    }

    next()
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      })
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      })
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    })
  }
}

export default auth
