import { Schema, model, Types, models } from "mongoose";
import { v4 as uuidv4 } from "uuid";
/**
 * This is an interface representing a document for a file in the database(MongoDB).
 */
export interface InterfaceFile {
  _id: Types.ObjectId;
  name: string;
  url: string | undefined;
  size: number | undefined;
  secret: string;
  createdAt: Date;
  contentType: string | undefined;
  status: string;
}
/**
 * This is the structure of a file
 * @param name - Name
 * @param url - URL
 * @param size - Size
 * @param secret - Secret
 * @param reatedAt - Created at Date
 * @param contentType - Content Type
 * @param status - Status
 */
const fileSchema = new Schema({
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
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
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
});

const fileModel = () => model<InterfaceFile>("File", fileSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const File = (models.File || fileModel()) as ReturnType<
  typeof fileModel
>;
