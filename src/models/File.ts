import type { Types, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { createLoggingMiddleware } from "../libraries/dbLogger";
/**
 * This is an interface representing a document for a file in the database(MongoDB).
 */
export interface InterfaceFile {
  _id: Types.ObjectId;
  name: string;
  url: string | undefined;
  size: number | undefined;
  secret: string;
  contentType: string | undefined;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for a file.
 * Defines the structure of the file document stored in MongoDB.
 * @param name - The name of the file.
 * @param url - The URL where the file is stored.
 * @param size - The size of the file in bytes.
 * @param secret - A secret key associated with the file.
 * @param contentType - The MIME type of the file.
 * @param status - The status of the file (e.g., ACTIVE, BLOCKED, DELETED).
 * @param createdAt - The date and time when the file was created.
 * @param updatedAt - The date and time when the file was last updated.
 */
const fileSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      default: uuidv4(), // Generates a unique identifier for the name by default
    },
    url: {
      type: String,
    },
    size: {
      type: Number,
    },
    secret: {
      type: String,
      required: true,
    },
    contentType: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      enum: ["ACTIVE", "BLOCKED", "DELETED"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  },
);

// Add logging middleware for fileSchema
createLoggingMiddleware(fileSchema, "File");

/**
 * Function to retrieve or create the Mongoose model for the File.
 * This is necessary to avoid the OverwriteModelError during testing.
 * @returns The Mongoose model for the File.
 */
const fileModel = (): Model<InterfaceFile> =>
  model<InterfaceFile>("File", fileSchema);

/**
 * The Mongoose model for the File.
 * If the model already exists (e.g., during testing), it uses the existing model.
 * Otherwise, it creates a new model.
 */
export const File = (models.File || fileModel()) as ReturnType<
  typeof fileModel
>;
