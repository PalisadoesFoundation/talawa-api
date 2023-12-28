import type { Types, PopulatedDoc, Document, Model } from "mongoose";
import { Schema, model, models } from "mongoose";
import type { InterfaceUser } from "./User";

/**
 * This is an interface representing a document for a transaction log in the database(MongoDB).
 */
export interface InterfaceTransactionLog {
  _id: Types.ObjectId;
  createdBy: PopulatedDoc<InterfaceUser & Document>;
  type: string;
  message: string;
  modelName: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * This is the Structure of the TransactionLog
 * @param createdBy - The user who created the TransactionLog
 * @param type - Type of transaction in the database, create update or delete
 * @param modelName - Name of model that was changed
 * @param message - Message for the log
 * @param createdAt - Timestamp of log creation
 * @param updatedAt - Timestamp of log updation
 */

const transactionLogSchema = new Schema(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      required: true,
      enum: ["CREATE", "UPDATE", "DELETE"],
    },
    modelName: {
      type: String,
      required: true,
    },
    message: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const transactionLogModel = (): Model<InterfaceTransactionLog> =>
  model<InterfaceTransactionLog>("TransactionLog", transactionLogSchema);

// This syntax is needed to prevent Mongoose OverwriteModelError while running tests.
export const TransactionLog = (models.TransactionLog ||
  transactionLogModel()) as ReturnType<typeof transactionLogModel>;
