// src/models/User.model.ts
import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  _id: Types.ObjectId
  email: string;
  password?: string | null;
  domain?: string | null;
  otp?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    email:    { type: String, required: true, unique: true },
    password: { type: String, default: null },
    domain:   { type: String, default: null },
    otp:      { type: String, default: null },
  },
  { timestamps: true }
);

UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
export default User;
