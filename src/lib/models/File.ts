import { Schema, model, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IFile {
  name: string;
  url?: string;
  size?: number;
  secret: string;
  createdAt: Date;
  contentType?: string;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
}

const fileSchema = new Schema<IFile, Model<IFile>, IFile>({
  name: {
    type: String,
    required: true,
    default: uuidv4(),
  },
  url: {
    type: String,
  },
  size: {
    type: Number,
  },
  secret: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now()),
  },
  contentType: {
    type: String,
  },
  status: {
    type: String,
    required: true,
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
    default: 'ACTIVE',
  },
});
export const File = model<IFile>('File', fileSchema);
