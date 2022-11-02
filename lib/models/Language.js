const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @name LangModel
 * @function
 * @description This is the structure of a Language Model.
 * @param {String} lang_code Code of the language, for example: en for english.
 * @param {String} value Value.
 * @param {Boolean} verified Language code is verified or not.
 * @param {Date} createdAt Time stamp of data creation.
 */
const LangModel = new Schema({
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
 * @name LangSchema
 * @function
 * @description This is the structure of a Language Schema.
 * @param {String} en Code for english language.
 * @param {LangModel[]} translation Refer to LangModel Schema.
 * @param {Boolean} verified Language code is verified or not.
 * @param {Date} createdAt Time stamp of data creation.
 */
const LangSchema = new Schema({
  en: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  translation: [LangModel],
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

module.exports = mongoose.model('Language', LangSchema);
