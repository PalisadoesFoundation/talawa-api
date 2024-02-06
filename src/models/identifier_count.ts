import mongoose, { Schema, model } from "mongoose";
import type { Document } from "mongoose";

interface InterfaceIdentifier extends Document{
  id: string,
  sequence_value : number
}

const identifierSchema = new Schema<InterfaceIdentifier>({
  _id: { type: String, required: true },
  sequence_value: { type: Number },
});

let lastIdentifier:InterfaceIdentifier
if (mongoose.models.identifier_count) {
  lastIdentifier = model("identifier_count");
}
else {
  lastIdentifier = model("identifier_count",identifierSchema)
}


export const identifier_count = lastIdentifier;


