import { Schema, model, Types, Document, PopulatedDoc, models } from "mongoose";

export interface Interface_LanguageModel {
  lang_code: string;
  value: string;
  verified: boolean;
  createdAt: Date;
}

const languageModelSchema = new Schema({
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
    default: Date.now,
  },
});

export interface Interface_Language {
  _id: Types.ObjectId;
  en: string;
  translation: Array<PopulatedDoc<Interface_LanguageModel & Document>>;
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
    default: Date.now,
  },
});

const LanguageModel = () =>
  model<Interface_Language>("Language", languageSchema);

export const Language = (models.Language || LanguageModel()) as ReturnType<
  typeof LanguageModel
>;
