import { TRANSACTION_LOG_PATH } from "../constants";
import type { Query, Schema } from "mongoose";

const winston = require("winston");

export type TransactionLogInfo = {
  timestamp: string;
  model: string;
  type: string;
  query?: string;
  update?: string;
};

const dbLogger = winston.createLogger({
  level: "info",
  format: winston.format.printf((logEntry: TransactionLogInfo) => {
    let logMessage = `timestamp=${logEntry.timestamp}, model=${logEntry.model}, type=${logEntry.type}`;
    if (logEntry.update && logEntry.update.length > 0) {
      logMessage += `, update=${logEntry.update}`;
    }
    if (logEntry.query && logEntry.query.length > 0) {
      logMessage += `, query=${logEntry.query}`;
    }
    return logMessage;
  }),
  transports: [new winston.transports.File({ filename: TRANSACTION_LOG_PATH })],
});

interface InterfaceLoggableDocument {
  logInfo: TransactionLogInfo;
}

export enum TranscactionLogTypes {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
}

export function createLoggingMiddleware(
  schema: Schema,
  modelName: string
): void {
  const logAction = (
    type: TranscactionLogTypes,
    thisContext?: Query<any, InterfaceLoggableDocument>
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

  schema.pre<InterfaceLoggableDocument>("save", function (next) {
    this.logInfo = logAction(TranscactionLogTypes.CREATE);
    next();
  });

  schema.post<InterfaceLoggableDocument>("save", function () {
    dbLogger.info("success", this.logInfo);
  });

  const updateOperations = ["findOneAndUpdate", "updateOne", "updateMany"];
  updateOperations.forEach((operation) => {
    schema.pre<Query<any, InterfaceLoggableDocument>>(
      operation,
      function (next) {
        (this as any).logInfo = logAction(TranscactionLogTypes.UPDATE, this);
        next();
      }
    );

    schema.post<Query<any, InterfaceLoggableDocument>>(operation, function () {
      dbLogger.info("success", (this as any).logInfo);
    });
  });

  const deleteOperations = ["deleteOne", "deleteMany"];
  deleteOperations.forEach((operation) => {
    schema.pre<Query<any, InterfaceLoggableDocument>>(
      operation,
      function (next) {
        (this as any).logInfo = logAction(TranscactionLogTypes.DELETE, this);
        next();
      }
    );

    schema.post<Query<any, InterfaceLoggableDocument>>(operation, function () {
      dbLogger.info("success", (this as any).logInfo);
    });
  });
}

export default dbLogger;
