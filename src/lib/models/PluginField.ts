import { Schema, model, Model } from 'mongoose';

export interface Interface_PluginField {
  key: string;
  value: string;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
  createdAt: Date;
}

const pluginFieldSchema = new Schema<
  Interface_PluginField,
  Model<Interface_PluginField>,
  Interface_PluginField
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

export const PluginField = model<Interface_PluginField>(
  'PluginField',
  pluginFieldSchema
);
