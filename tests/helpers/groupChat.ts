import { nanoid } from "nanoid";
import {
  GroupChat,
  GroupChatMessage,
  Interface_GroupChat,
  Interface_GroupChatMessage,
} from "../../src/models";
import {
  createTestUserAndOrganization,
  TestOrganizationType,
  TestUserType,
} from "./userAndOrg";
import { Document } from "mongoose";

export type TestGroupChatType =
  | (Interface_GroupChat & Document<any, any, Interface_GroupChat>)
  | null;

export type TestGroupChatMessageType =
  | (Interface_GroupChatMessage &
      Document<any, any, Interface_GroupChatMessage>)
  | null;

export const createTestGroupChat = async (): Promise<
  [TestUserType, TestOrganizationType, TestGroupChatType]
> => {
  const [testUser, testOrganization] = await createTestUserAndOrganization();
  const testGroupChat = await GroupChat.create({
    creator: testUser!._id,
    users: [testUser!._id],
    organization: testOrganization!._id,
    title: `title${nanoid().toLowerCase()}`,
  });

  return [testUser, testOrganization, testGroupChat];
};

export const createTestGroupChatMessage = async (): Promise<
  [
    TestUserType,
    TestOrganizationType,
    TestGroupChatType,
    TestGroupChatMessageType
  ]
> => {
  const [testUser, testOrganization, testGroupChat] =
    await createTestGroupChat();
  const testGroupChatMessage = await GroupChatMessage.create({
    groupChatMessageBelongsTo: testGroupChat!._id,
    sender: testUser!._id,
    createdAt: new Date(),
    messageContent: `messageContent${nanoid().toLowerCase()}`,
  });

  return [testUser, testOrganization, testGroupChat, testGroupChatMessage];
};
