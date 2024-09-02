import mongoose, { model, Schema } from 'mongoose';
import type { Model, Document } from 'mongoose';

/**
 * Interface representing an identifier document in MongoDB.
 * Extends Mongoose's Document interface to include custom fields.
 */
interface InterfaceIdentifier extends Document {
  /**
   * The unique identifier for the document.
   */
  _id: string;

  /**
   * The sequence value associated with the identifier.
   */
  sequence_value: number;
}

/**
 * Schema definition for the identifier document.
 */
const identifierSchema = new Schema<InterfaceIdentifier>({
  /**
   * The unique identifier for the document.
   * @type {String}
   * @required
   */
  _id: { type: String, required: true },

  /**
   * The sequence value associated with the identifier.
   * @type {Number}
   */
  sequence_value: { type: Number },
});

/**
 * Mongoose model for the identifier collection.
 * Reuses the existing model if it already exists, or creates a new one.
 */
const lastIdentifier: Model<InterfaceIdentifier> =
  mongoose.models.identifier_count ||
  model<InterfaceIdentifier>('identifier_count', identifierSchema);

/**
 * Export the Mongoose model for the identifier collection.
 */
export const identifier_count = lastIdentifier;
