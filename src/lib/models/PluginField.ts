import { Schema, model, Model } from 'mongoose';

export interface IPluginField {
  key: string;
  value: string;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
  createdAt?: Date;
}

const pluginFieldSchema = new Schema<
  IPluginField,
  Model<IPluginField>,
  IPluginField
>({
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
    default: () => new Date(Date.now()),
  },
});

export const PluginField = model<IPluginField>(
  'PluginField',
  pluginFieldSchema
);
