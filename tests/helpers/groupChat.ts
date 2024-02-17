import { nanoid } from "nanoid";
import type {
  InterfaceGroupChat,
  InterfaceGroupChatMessage,
} from "../../src/models";
import { GroupChat, GroupChatMessage } from "../../src/models";
import type { TestOrganizationType, TestUserType } from "./userAndOrg";
import { createTestUserAndOrganization } from "./userAndOrg";
import type { Document } from "mongoose";

export type TestGroupChatType =
  | (InterfaceGroupChat & Document<unknown, unknown, InterfaceGroupChat>)
  | null;

export type TestGroupChatMessageType =
  | (InterfaceGroupChatMessage &
      Document<unknown, unknown, InterfaceGroupChatMessage>)
  | null;

export const createTestGroupChat = async (): Promise<
  [TestUserType, TestOrganizationType, TestGroupChatType]
> => {
  const [testUser, testOrganization] = await createTestUserAndOrganization();
  if (testUser && testOrganization) {
    const testGroupChat = await GroupChat.create({
      creatorId: testUser._id,
      users: [testUser._id],
      organization: testOrganization._id,
      title: `title${nanoid().toLowerCase()}`,
    });

    return [testUser, testOrganization, testGroupChat];
  } else {
    return [testUser, testOrganization, null];
  }
};

export const createTestGroupChatMessage = async (): Promise<
  [
    TestUserType,
    TestOrganizationType,
    TestGroupChatType,
    TestGroupChatMessageType,
  ]
> => {
  const [testUser, testOrganization, testGroupChat] =
    await createTestGroupChat();

  if (testGroupChat && testUser) {
    const testGroupChatMessage = await GroupChatMessage.create({
      groupChatMessageBelongsTo: testGroupChat._id,
      sender: testUser._id,
      createdAt: new Date(),
      messageContent: `messageContent${nanoid().toLowerCase()}`,
    });

    return [testUser, testOrganization, testGroupChat, testGroupChatMessage];
  } else {
    return [testUser, testOrganization, testGroupChat, null];
  }
};
