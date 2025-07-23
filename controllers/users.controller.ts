// src/controllers/users.controller.ts
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User.model';
import SubscriberEmail, { ISubscriberEmail } from '../models/SubscriberEmail.model';

/**
 * Returns a list of users with published web content.
 */
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const users = (await User.aggregate([
      { $match: { password: { $ne: null } } },
      {
        $lookup: {
          from: 'web_contents',
          localField: '_id',
          foreignField: 'user',
          as: 'webContent',
        },
      },
      { $unwind: { path: '$webContent', preserveNullAndEmptyArrays: false } },
      {
        $match: {
          domain: { $exists: true, $ne: null },
          'webContent.landing.image': { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          _id: 1,
          domain: { $concat: ['$domain', '.siher.eth.link'] },
          fullName: '$webContent.landing.fullName',
          image: '$webContent.landing.image',
        },
      },
    ])) as Array<{ _id: mongoose.Types.ObjectId; domain: string; fullName: string; image: string }>;

    return res.status(200).json(users);
  } catch (err) {
    return next(err);
  }
};

/**
 * Subscribes an email if not already present.
 */
export const subscribeEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { email } = req.query as { email?: string };
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const existing: ISubscriberEmail | null = await SubscriberEmail.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email is already subscribed' });
    }

    const newSub: ISubscriberEmail = new SubscriberEmail({ email });
    await newSub.save();

    return res.status(201).json({
      message: 'Email subscribed successfully',
      email,
    });
  } catch (err) {
    return next(err);
  }
};
