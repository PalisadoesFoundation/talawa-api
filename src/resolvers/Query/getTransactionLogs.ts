import * as fs from "fs";
import { TRANSACTION_LOG_PATH } from "../../constants";
import type {
  QueryResolvers,
  TransactionLog,
} from "../../types/generatedGraphQLTypes";

/**
 * This function returns list of logs from the logs file.
 * @param _parent-
 * @param args - An object that contains `hours`.
 * @returns An array that contains a list of transaction objects.
 */

export const getTransactionLogs: QueryResolvers["getTransactionLogs"] = (
  _parent,
  args,
  _context
) => {
  const hours = args.hours ?? 24;
  const logPath = TRANSACTION_LOG_PATH as string;
  const logsContent = fs.readFileSync(logPath, "utf-8");
  const logsLines = logsContent.split("\n");
  if (logsLines.length === 0) {
    return [];
  } else {
    logsLines.pop(); // to remove the last empty string
  }

  const transactions = logsLines.map((line) => parseTransactionLogLine(line));

  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - hours);

  const filteredTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.timestamp);
    return transactionDate > cutoff;
  });

  filteredTransactions.sort((a, b) => {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return dateB.getTime() - dateA.getTime();
  });

  return filteredTransactions;
};

function parseTransactionLogLine(line: string): TransactionLog {
  const transactionObj = {};
  const entries = line.split(", ");
  entries.forEach((entry) => {
    const [key, value] = entry.split("=");
    if (key && value) {
      if (key === "timestamp") {
        (transactionObj as any)[key.trim()] = new Date(value.trim());
      } else {
        (transactionObj as any)[key.trim()] = value.trim();
      }
    }
  });
  return transactionObj as TransactionLog;
}
