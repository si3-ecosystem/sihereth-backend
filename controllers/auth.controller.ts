// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import User, { IUser } from '../models/User.model';
import WebContent, { IWebContent } from '../models/WebContent.model';

const errorResponse = (res: Response, status: number, message: string): Response =>
  res.status(status).json({ message });

export const approveUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { email } = req.query as { email?: string };
    if (!email) return errorResponse(res, 400, 'Email is required');

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email))
      return errorResponse(res, 400, 'Invalid email format');

    const existing: IUser | null = await User.findOne({
      email: email.toLowerCase(),
    });
    if (existing) {
      return errorResponse(res, 409, 'User already exists');
    }

    const newUser: IUser = new User({
      email:    email.toLowerCase(),
      password: null,
    });

    try {
      await newUser.save();
      return res.status(201).json({
        message: 'User successfully approved',
        email:   newUser.email,
      });
    } catch (saveErr) {
      console.error('[Auth] Error saving new user:', (saveErr as Error).message);
      return errorResponse(res, 500, 'Failed to create user');
    }
  } catch (err) {
    console.error('[Auth] Unexpected error in approveUser:', (err as Error).message);
    return errorResponse(res, 500, 'Internal server error');
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };
    if (!email || !password) {
      console.warn('[LOGIN] Missing email or password');
      return errorResponse(res, 400, 'Email and password are required');
    }

    const user: IUser | null = await User.findOne({
      email: email.toLowerCase(),
    });
    if (!user) {
      return errorResponse(res, 404, 'User does not exist');
    }

    if (!user.password) {
      user.password = password;
      await user.save();
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn('[LOGIN] Incorrect password');
      return errorResponse(res, 403, 'Incorrect password');
    }

    const tokenPayload = {
      id:    user._id.toString() as string,
      email: user.email,
      name:  (user as any).name as string | undefined, // if you add name to schema
    };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!, {
      expiresIn: '3d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite:
        process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    const webContent: IWebContent | null = await WebContent.findOne({
      user: user._id,
    });

    let formattedDomain = '';
    if (user.domain) {
      formattedDomain = `${user.domain}.siher.eth.link`;
    }

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id:         user._id,
        email:      user.email,
        domain:     formattedDomain,
        webContent: webContent || null,
      },
    });
  } catch (err) {
    console.error('[LOGIN] Error:', err);
    next(err);
  }
};

export const validateToken = (
  req: Request,
  res: Response
): Response => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return errorResponse(res, 401, 'No token provided');
    }

    jwt.verify(token, process.env.JWT_SECRET!, (err: VerifyErrors | null) => {
      if (err) {
        return errorResponse(res, 403, 'Invalid or expired token');
      }
      return res.status(200).json({ success: true });
    });
    // Note: the callback handles the response
    return res as any;
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, 'Internal server error');
  }
};
