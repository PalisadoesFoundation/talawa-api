const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LangModel = new Schema({
  lang_code: {
    type: String,
    required: true,
  },
  value: {
    type: Boolean,
    required: true,
    lowercase: true,
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
