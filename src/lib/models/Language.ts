import { Schema, model, Model, Types } from 'mongoose';

export interface ILanguageModel {
  lang_code: string;
  value: string;
  verified: boolean;
  createdAt: Date;
}

const languageModelSchema = new Schema<
  ILanguageModel,
  Model<ILanguageModel>,
  ILanguageModel
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

interface ILanguage {
  en: string;
  translation: Array<ILanguageModel>;
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

export const Language = model<ILanguage>('Language', languageSchema);
