const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
