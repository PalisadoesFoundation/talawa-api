import mongoose, { model, Schema } from "mongoose";
import type { Model, Document } from "mongoose";

// Define the interface extending Document
interface InterfaceIdentifier extends Document {
  _id: string;
  sequence_value: number;
}

// Define the schema
const identifierSchema = new Schema<InterfaceIdentifier>({
  _id: { type: String, required: true },
  sequence_value: { type: Number },
});

// Check if the model exists, and create it if it doesn't
const lastIdentifier: Model<InterfaceIdentifier> =
  mongoose.models.identifier_count ||
  model<InterfaceIdentifier>("identifier_count", identifierSchema);

// Export the model
export const identifier_count = lastIdentifier;
