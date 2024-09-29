import type { PopulatedDoc, Types, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceGroup } from "./Group";
import type { InterfaceUser } from "./User";
import { createLoggingMiddleware } from "../libraries/dbLogger";

/**
 * Interface representing a document for a message in the database (MongoDB).
 */
export interface InterfaceMessage {
  _id: Types.ObjectId;
  text: string;
  imageUrl: string | undefined;
  videoUrl: string | undefined;
  createdAt: Date;
  updatedAt: Date;
  creatorId: PopulatedDoc<InterfaceUser & Document>;
  group: PopulatedDoc<InterfaceGroup & Document>;
  status: string;
}

/**
 * Mongoose schema for a Message.
 * Defines the structure of the Message document stored in MongoDB.
 * @param text - The content of the message.
 * @param imageUrl - Optional URL of an image attached to the message.
 * @param videoUrl - Optional URL of a video attached to the message.
 * @param creatorId - Reference to the User who created the message.
 * @param group - Reference to the Group to which the message belongs.
 * @param status - The status of the message (e.g., ACTIVE, BLOCKED, DELETED).
 * @param createdAt - The date and time when the message was created.
 * @param updatedAt - The date and time when the message was last updated.
 */
const messageSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: false,
    },
    videoUrl: {
      type: String,
      required: false,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
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

// Add logging middleware for messageSchema
createLoggingMiddleware(messageSchema, "Message");

/**
 * Function to retrieve or create the Mongoose model for the Message.
 * This is necessary to avoid the OverwriteModelError during testing.
 * @returns The Mongoose model for the Message.
 */
const messageModel = (): Model<InterfaceMessage> =>
  model<InterfaceMessage>("Message", messageSchema);

/**
 * The Mongoose model for the Message.
 * If the model already exists (e.g., during testing), it uses the existing model.
 * Otherwise, it creates a new model.
 */
export const Message = (models.Message || messageModel()) as ReturnType<
  typeof messageModel
>;
