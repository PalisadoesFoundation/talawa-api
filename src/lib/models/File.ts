import { Schema, model, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface Interface_File {
  name: string;
  url?: string;
  size?: number;
  secret: string;
  createdAt: Date;
  contentType?: string;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
}

const fileSchema = new Schema<
  Interface_File,
  Model<Interface_File>,
  Interface_File
>({
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

export const File = model<Interface_File>('File', fileSchema);
