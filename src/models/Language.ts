import type { Types, Document, PopulatedDoc, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import { createLoggingMiddleware } from "../libraries/dbLogger";

/**
 * Interface representing a Language Model document in the database (MongoDB).
 */
export interface InterfaceLanguageModel {
  lang_code: string;
  value: string;
  verified: boolean;
  createdAt: Date;
}

/**
 * Mongoose schema for a Language Model.
 * Defines the structure of the Language Model document stored in MongoDB.
 * @param lang_code - The code of the language (e.g., "en" for English).
 * @param value - The value associated with the language.
 * @param verified - Indicates if the language code is verified.
 * @param createdAt - The date and time when the language model was created.
 */
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

/**
 * Interface representing a Language document in the database (MongoDB).
 */
export interface InterfaceLanguage {
  _id: Types.ObjectId;
  en: string;
  translation: PopulatedDoc<InterfaceLanguageModel & Document>[];
  createdAt: Date;
}

/**
 * Mongoose schema for a Language.
 * Defines the structure of the Language document stored in MongoDB.
 * @param en - The code for the English language.
 * @param translation - An array of Language Model documents associated with this language.
 * @param createdAt - The date and time when the language document was created.
 */
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

// Add logging middleware for languageSchema
createLoggingMiddleware(languageSchema, "Language");

/**
 * Function to retrieve or create the Mongoose model for the Language.
 * This is necessary to avoid the OverwriteModelError during testing.
 * @returns The Mongoose model for the Language.
 */
const languageModel = (): Model<InterfaceLanguage> =>
  model<InterfaceLanguage>("Language", languageSchema);

/**
 * The Mongoose model for the Language.
 * If the model already exists (e.g., during testing), it uses the existing model.
 * Otherwise, it creates a new model.
 */
export const Language = (models.Language || languageModel()) as ReturnType<
  typeof languageModel
>;
