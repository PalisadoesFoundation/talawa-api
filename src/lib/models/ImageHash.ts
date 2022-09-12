import { Schema, model, Types } from 'mongoose';

export interface Interface_ImageHash {
  _id: Types.ObjectId;
  hashValue: string;
  fileName: string;
  numberOfUses: number;
  status: string;
}

const imageHashSchema = new Schema({
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
