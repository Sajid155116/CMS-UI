import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserPreference {
  viewMode?: 'grid' | 'list';
}

export interface IUser {
  email: string;
  password: string;
  name: string;
  preferences?: IUserPreference;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
  id: string;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    preferences: {
      type: {
        viewMode: { type: String, enum: ['grid', 'list'] },
      },
      default: {},
    },
  },
  { timestamps: true }
);

// Transform _id to id
UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.password; // Never include password in JSON
    return ret;
  },
});

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
