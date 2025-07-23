// src/models/SubscriberEmail.model.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

/**
 * Interface representing a subscriber email document in MongoDB.
 */
export interface ISubscriberEmail extends Document {
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for subscriber emails.
 */
const SubscriberEmailSchema: Schema<ISubscriberEmail> = new Schema(
  {
    email: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

/**
 * Mongoose model for subscriber emails.
 */
const SubscriberEmail: Model<ISubscriberEmail> = mongoose.model<
  ISubscriberEmail
>('SubscriberEmail', SubscriberEmailSchema);

export default SubscriberEmail;
