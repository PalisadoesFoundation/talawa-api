import { LOG, LOG_PATH, TransactionLogTypes } from "../constants";
import type { Query, Schema, Document } from "mongoose";
import winston from "winston";

export type TransactionLogInfo = {
  timestamp: string;
  model: string;
  type: string;
  query?: string;
  update?: string;
};

let dbLogger: winston.Logger | null = null;

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

export interface InterfaceLoggableDocument extends Document {
  logInfo: TransactionLogInfo;
}

export interface InterfaceLoggableQuery<T> extends Query<unknown, T> {
  logInfo?: TransactionLogInfo;
}

export function createLoggingMiddleware<T extends Document>(
  schema: Schema<T>,
  modelName: string,
): void {
  if (!dbLogger) {
    return;
  }

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

  schema.pre<InterfaceLoggableDocument>("save", function (next) {
    this.logInfo = logAction(TransactionLogTypes.CREATE);
    next();
  });

  schema.post<InterfaceLoggableDocument>("save", function () {
    if (dbLogger) {
      dbLogger.info("success", this.logInfo);
    }
  });

  const updateOperations: ("findOneAndUpdate" | "updateOne" | "updateMany")[] =
    ["findOneAndUpdate", "updateOne", "updateMany"];
  updateOperations.forEach((operation) => {
    schema.pre(operation, function (this: InterfaceLoggableQuery<T>, next) {
      this.logInfo = logAction(TransactionLogTypes.UPDATE, this);
      next();
    });

    schema.post(operation, function (this: InterfaceLoggableQuery<T>) {
      if (dbLogger) {
        dbLogger?.info("success", this.logInfo);
      }
    });
  });

  const deleteOperations: ("deleteOne" | "deleteMany")[] = [
    "deleteOne",
    "deleteMany",
  ];
  deleteOperations.forEach((operation) => {
    schema.pre(operation, function (this: InterfaceLoggableQuery<T>, next) {
      this.logInfo = logAction(TransactionLogTypes.DELETE, this);
      next();
    });

    schema.post(operation, function (this: InterfaceLoggableQuery<T>) {
      if (dbLogger) {
        dbLogger.info("success", this.logInfo);
      }
    });
  });
}

export default dbLogger;
