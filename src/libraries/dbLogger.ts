import { LOG, LOG_PATH, TransactionLogTypes } from "../constants";
import type { Query, Schema, Document } from "mongoose";
import winston from "winston";

/**
 * The structure of a transaction log entry.
 */
export type TransactionLogInfo = {
  /** The timestamp when the log entry was created */
  timestamp: string;
  /** The name of the model associated with the log entry */
  model: string;
  /** The type of transaction (e.g., create, update, delete) */
  type: string;
  /** The query executed (optional) */
  query?: string;
  /** The update performed (optional) */
  update?: string;
};

// Initialize the database logger to null
let dbLogger: winston.Logger | null = null;

// If logging is enabled and a log path is specified, create a Winston logger
if (LOG && LOG_PATH) {
  dbLogger = winston.createLogger({
    level: "info",
    format: winston.format.printf((logEntry) => {
      let logMessage = `timestamp=${logEntry.timestamp}, model=${logEntry.model}, type=${logEntry.type}`;
      if (logEntry.update && logEntry.update.length > 0) {
        logMessage += `, update=${logEntry.update}`;
      }
      if (logEntry.query && logEntry.query.length > 0) {
        logMessage += `, query=${logEntry.query}`;
      }
      return logMessage;
    }),
    transports: [new winston.transports.File({ filename: LOG_PATH })],
  });
}

/**
 * Interface for a document that includes logging information.
 */
export interface InterfaceLoggableDocument extends Document {
  /** Information about the transaction log */
  logInfo: TransactionLogInfo;
}

/**
 * Interface for a query that can include logging information.
 */
export interface InterfaceLoggableQuery<T> extends Query<unknown, T> {
  /** Information about the transaction log (optional) */
  logInfo?: TransactionLogInfo;
}

/**
 * Creates a logging middleware for a Mongoose schema. This middleware logs
 * create, update, and delete operations on the specified schema.
 *
 * @param schema - The Mongoose schema to which the middleware will be added
 * @param modelName - The name of the model associated with the schema
 */
export function createLoggingMiddleware<T extends Document>(
  schema: Schema<T>,
  modelName: string,
): void {
  // If no logger is configured, exit the function early
  if (!dbLogger) {
    return;
  }

  /**
   * Creates a log entry for a specific action.
   *
   * @param type - The type of transaction (create, update, delete)
   * @param thisContext - The query context (optional)
   * @returns A TransactionLogInfo object with details about the transaction
   */
  const logAction = (
    type: TransactionLogTypes,
    thisContext?: InterfaceLoggableQuery<T>,
  ): TransactionLogInfo => {
    return {
      timestamp: new Date().toISOString(),
      model: modelName,
      type: type,
      query: thisContext ? JSON.stringify(thisContext.getQuery()) : undefined,
      update:
        thisContext && "getUpdate" in thisContext
          ? JSON.stringify(thisContext.getUpdate())
          : undefined,
    };
  };

  // Middleware to log "save" operations before they occur
  schema.pre<InterfaceLoggableDocument>("save", function (next) {
    this.logInfo = logAction(TransactionLogTypes.CREATE);
    next();
  });

  // Middleware to log "save" operations after they occur
  schema.post<InterfaceLoggableDocument>("save", function () {
    if (dbLogger) {
      dbLogger.info("success", this.logInfo);
    }
  });

  // List of update operations to log
  const updateOperations: ("findOneAndUpdate" | "updateOne" | "updateMany")[] =
    ["findOneAndUpdate", "updateOne", "updateMany"];
  updateOperations.forEach((operation) => {
    // Middleware to log update operations before they occur
    schema.pre(operation, function (this: InterfaceLoggableQuery<T>, next) {
      this.logInfo = logAction(TransactionLogTypes.UPDATE, this);
      next();
    });

    // Middleware to log update operations after they occur
    schema.post(operation, function (this: InterfaceLoggableQuery<T>) {
      if (dbLogger) {
        dbLogger?.info("success", this.logInfo);
      }
    });
  });

  // List of delete operations to log
  const deleteOperations: ("deleteOne" | "deleteMany")[] = [
    "deleteOne",
    "deleteMany",
  ];
  deleteOperations.forEach((operation) => {
    // Middleware to log delete operations before they occur
    schema.pre(operation, function (this: InterfaceLoggableQuery<T>, next) {
      this.logInfo = logAction(TransactionLogTypes.DELETE, this);
      next();
    });

    // Middleware to log delete operations after they occur
    schema.post(operation, function (this: InterfaceLoggableQuery<T>) {
      if (dbLogger) {
        dbLogger.info("success", this.logInfo);
      }
    });
  });
}

// Export the logger as the default export
export default dbLogger;
