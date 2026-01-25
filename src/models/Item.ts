import mongoose, { Schema, Document, Model } from 'mongoose';

export enum ItemType {
  FILE = 'file',
  FOLDER = 'folder',
}

export interface IItem {
  name: string;
  type: ItemType;
  parentId: string | null;
  userId: string;
  size?: number;
  mimeType?: string;
  storageKey?: string;
  path: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IItemDocument extends IItem, Document {
  id: string;
}

const ItemSchema = new Schema<IItemDocument>(
  {
    name: { type: String, required: true },
    type: { type: String, enum: Object.values(ItemType), required: true },
    parentId: { type: String, default: null, index: true },
    userId: { type: String, required: true, index: true },
    size: { type: Number },
    mimeType: { type: String },
    storageKey: { type: String },
    path: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

// Transform _id to id
ItemSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Unique name per parent per user
ItemSchema.index({ parentId: 1, userId: 1, name: 1 }, { unique: true });

export const Item: Model<IItemDocument> =
  mongoose.models.Item || mongoose.model<IItemDocument>('Item', ItemSchema);
