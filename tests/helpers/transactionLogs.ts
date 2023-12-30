import { createTestUser } from "./userAndOrg";
import type { TestUserType } from "./userAndOrg";
import type { InterfaceTransactionLog } from "../../src/models";
import { TransactionLog } from "../../src/models";
import type { Document } from "mongoose";
import { TRANSACTION_LOG_TYPES } from "../../src/constants";

export type TestTransactionLog =
  | (InterfaceTransactionLog & Document<any, any, InterfaceTransactionLog>)
  | null;

export const createTestTransactionLog = async (): Promise<
  [TestUserType, TestTransactionLog]
> => {
  const testUser = await createTestUser();

  const testTransactionLog = await TransactionLog.create({
    createdBy: testUser?._id,
    type: TRANSACTION_LOG_TYPES.UPDATE,
    message: "Test log message",
    modelName: "User",
  });
  return [testUser, testTransactionLog];
};
