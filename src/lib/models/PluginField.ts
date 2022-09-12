import { Schema, model, Types } from 'mongoose';

export interface Interface_PluginField {
  _id: Types.ObjectId;
  key: string;
  value: string;
  status: string;
  createdAt: Date;
}

const pluginFieldSchema = new Schema({
  key: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
    default: 'ACTIVE',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const PluginField = model<Interface_PluginField>(
  'PluginField',
  pluginFieldSchema
);
