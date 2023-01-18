import { DirectChat } from "../../../src/resolvers/DirectChat/index";
import { DirectChatResolvers } from "../../../src/types/generatedGraphQLTypes";
import { creator } from "../../../src/resolvers/DirectChat/creator";
import { messages } from "../../../src/resolvers/DirectChat/messages";
import { organization } from "../../../src/resolvers/DirectChat/organization";
import { users } from "../../../src/resolvers/DirectChat/users";
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
