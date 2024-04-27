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
 * This is the structure of a file
 * @param name - Name
 * @param url - URL
 * @param size - Size
 * @param secret - Secret
 * @param createdAt - Timestamp of creation
 * @param updatedAt - Timestamp of updation
 * @param contentType - Content Type
 * @param status - Status
 */
const fileSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      default: uuidv4(),
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
    timestamps: true,
  },
);

createLoggingMiddleware(fileSchema, "File");

const fileModel = (): Model<InterfaceFile> =>
  model<InterfaceFile>("File", fileSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const File = (models.File || fileModel()) as ReturnType<
  typeof fileModel
>;
