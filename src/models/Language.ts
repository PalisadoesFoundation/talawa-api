import { Schema, model, Types, Document, PopulatedDoc, models } from "mongoose";
/**
 * This is an interface that represents a database document.
 */
export interface InterfaceLanguageModel {
  lang_code: string;
  value: string;
  verified: boolean;
  createdAt: Date;
}
/**
 * This schema defines the structure of a Language Model that corresponds to `InterfaceLanguageModel` document.
 * which is utilised as an association in the 'languageSchema' schema.
 * @param lang_code - Code of the language, for example: en for english.
 * @param value - Value.
 * @param verified - Language code is verified or not.
 * @param createdAt - Time stamp of data creation.
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
 * This is an interface that represents a database(MongoDB) document for Language.
 */
export interface InterfaceLanguage {
  _id: Types.ObjectId;
  en: string;
  translation: Array<PopulatedDoc<InterfaceLanguageModel & Document>>;
  createdAt: Date;
}
/**
 * This is the structure of a Language Schema that corresponds to `InterfaceLanguage` document.
 * @param en - Code for english language.
 * @param translation - Association that refers to `LangModel` Schema.
 * @param createdAt - Time stamp of data creation.
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

const languageModel = () =>
  model<InterfaceLanguage>("Language", languageSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const Language = (models.Language || languageModel()) as ReturnType<
  typeof languageModel
>;
