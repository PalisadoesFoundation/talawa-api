import { DirectChat } from "../../../src/lib/resolvers/DirectChat/index";
import { DirectChatResolvers } from "../../../src/generated/graphqlCodegen";
import { creator } from "../../../src/lib/resolvers/DirectChat/creator";
import { messages } from "../../../src/lib/resolvers/DirectChat/messages";
import { organization } from "../../../src/lib/resolvers/DirectChat/organization";
import { users } from "../../../src/lib/resolvers/DirectChat/users";
import { describe, it, beforeAll, expect } from "vitest";

let testDirectChat: DirectChatResolvers;

beforeAll(() => {
  testDirectChat = {
    creator,
    messages,
    organization,
    users,
  };
});

describe("resolvers -> DirectChat -> index", () => {
  it("creates the DirectChat", () => {
    expect(testDirectChat).toStrictEqual(DirectChat);
  });
});
