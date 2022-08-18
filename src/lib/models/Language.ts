import { Schema, model, Model, Types } from 'mongoose';

export interface Interface_LanguageModel {
  lang_code: string;
  value: string;
  verified: boolean;
  createdAt: Date;
}

const languageModelSchema = new Schema<
  Interface_LanguageModel,
  Model<Interface_LanguageModel>,
  Interface_LanguageModel
>({
  lang_code: {
    type: String,
    required: true,
    unique: false,
    lowercase: true,
  },
  value: {
    type: String,
    required: true,
    lowercase: true,
  },
  verified: {
    type: Boolean,
    required: true,
    default: false,
  },
  createdAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now()),
  },
});

interface Interface_Language {
  en: string;
  translation: Array<Interface_LanguageModel>;
  createdAt: Date;
}

const languageSchema = new Schema({
  en: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  translation: [languageModelSchema],
  createdAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now()),
  },
});

export const Language = model<Interface_Language>('Language', languageSchema);
