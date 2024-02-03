import { Schema, model } from "mongoose";

const identifierSchema = new Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 },
});
export const identifier_count = model("identifier", identifierSchema);
