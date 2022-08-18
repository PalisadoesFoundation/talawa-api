import { Schema, Types, model, Model } from 'mongoose';

export interface Interface_Plugin {
  orgId: Types.ObjectId;
  pluginName: string;
  pluginKey?: string;
  pluginStatus: 'ACTIVE' | 'BLOCKED' | 'DELETED';
  pluginType: 'UNIVERSAL' | 'PRIVATE';
  adminAccessAllowed: boolean;
  additionalInfo: Array<Types.ObjectId>;
  createdAt?: Date;
}

const pluginSchema = new Schema<
  Interface_Plugin,
  Model<Interface_Plugin>,
  Interface_Plugin
>({
  orgId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  pluginName: {
    type: String,
    required: true,
  },
  pluginKey: {
    type: String,
    required: false,
  },
  pluginStatus: {
    type: String,
    required: true,
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
    default: 'ACTIVE',
  },
  pluginType: {
    type: String,
    required: true,
    enum: ['UNIVERSAL', 'PRIVATE'],
    default: 'UNIVERSAL',
  },
  adminAccessAllowed: {
    type: Boolean,
    required: true,
    default: true,
  },
  additionalInfo: [
    {
      type: Schema.Types.ObjectId,
      ref: 'PluginField',
      required: false,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Plugin = model<Interface_Plugin>('Plugin', pluginSchema);
