// Import third-party modules
import { v4 as uuidv4 } from "uuid";
import { Schema, model, models } from "mongoose";
import type { Types, Model } from "mongoose";

// Interface definition for a file document
export interface InterfaceFile {
  _id: Types.ObjectId;
  fileName: string;
  mimeType: string;
  size: number;
  hash: {
    value: string;
    algorithm: string;
  };
  uri: string;
  referenceCount: number;
  metadata: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  encryption: boolean;
  archived: boolean;
  visibility: "PRIVATE" | "PUBLIC";
  backupStatus: string;
  status: "ACTIVE" | "BLOCKED" | "DELETED";
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

/**
 * Mongoose schema for the `File` collection.
 *
 * This schema defines the structure for storing files in the database, including details such as
 * the file name, size, hash, URI, visibility, and status. It also includes metadata, encryption, and archival details.
 * The schema automatically manages `createdAt` and `updatedAt` timestamps using Mongoose's `timestamps` option.
 *
 * @param fileName - The name of the file (defaults to a UUID if not provided).
 * @param mimeType - The MIME type of the file (e.g., `image/png`).
 * @param size - The size of the file in bytes.
 * @param hash - An object containing the hash value and the algorithm used for the hash.
 * @param uri - The URI of the file location.
 * @param referenceCount - The number of references to the file (defaults to 1).
 * @param metadata - An object containing additional metadata for the file.
 * @param encryption - Indicates whether the file is encrypted.
 * @param archived - Indicates whether the file is archived.
 * @param visibility - File visibility (`PRIVATE` or `PUBLIC`).
 * @param backupStatus - The status of the file's backup.
 * @param status - The current status of the file (`ACTIVE`, `BLOCKED`, or `DELETED`).
 * @param createdAt - The timestamp when the file was created.
 * @param updatedAt - The timestamp when the file was last updated.
 * @param archivedAt - The timestamp when the file was archived (if applicable).
 *
 * @example
 * ```typescript
 * const newFile = new File({
 *   fileName: "example.png",
 *   mimeType: "image/png",
 *   size: 2048,
 *   hash: { value: "abc123", algorithm: "sha256" },
 *   uri: "/path/to/file",
 * });
 * await newFile.save();
 * ```
 */
const fileSchema = new Schema<InterfaceFile>(
  {
    fileName: {
      type: String,
      required: true,
      default: uuidv4(),
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    hash: {
      value: {
        type: String,
        required: true,
      },
      algorithm: {
        type: String,
        required: true,
      },
    },
    uri: {
      type: String,
      required: true,
    },
    referenceCount: {
      type: Number,
      default: 1,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    archivedAt: {
      type: Date,
    },
    encryption: {
      type: Boolean,
      default: false,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    visibility: {
      type: String,
      enum: ["PRIVATE", "PUBLIC"],
      default: "PUBLIC",
    },
    backupStatus: {
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

/**
 * Creates and exports the Mongoose `File` model.
 *
 * The `File` model interacts with the `File` collection in the MongoDB database.
 * It allows you to create, retrieve, update, and delete file documents based on the defined schema.
 *
 * @returns The Mongoose model for the `File` collection.
 *
 * @example
 * ```typescript
 * const file = await File.findById(fileId);
 * console.log(file);
 * ```
 */
const fileModel = (): Model<InterfaceFile> =>
  model<InterfaceFile>("File", fileSchema);

export const File = (models.File || fileModel()) as ReturnType<
  typeof fileModel
>;
