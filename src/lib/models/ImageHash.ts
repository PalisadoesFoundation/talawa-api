import { Schema, model, Model } from 'mongoose';

export interface Interface_ImageHash {
  hashValue: string;
  fileName: string;
  numberOfUses: number;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
}

const imageHashSchema = new Schema<
  Interface_ImageHash,
  Model<Interface_ImageHash>,
  Interface_ImageHash
>({
  hashValue: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  numberOfUses: {
    type: Number,
    default: 0,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
    default: 'ACTIVE',
  },
});

export const ImageHash = model<Interface_ImageHash>(
  'ImageHash',
  imageHashSchema
);
