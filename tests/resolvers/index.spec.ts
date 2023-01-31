import { resolvers } from "../../src/resolvers/index";
import { Resolvers } from "../../src/types/generatedGraphQLTypes";
import { DirectChat } from "../../src/resolvers/DirectChat";
import { DirectChatMessage } from "../../src/resolvers/DirectChatMessage";
import { GroupChat } from "../../src/resolvers/GroupChat";
import { GroupChatMessage } from "../../src/resolvers/GroupChatMessage";
import { MembershipRequest } from "../../src/resolvers/MembershipRequest";
import { Mutation } from "../../src/resolvers/Mutation";
import { Organization } from "../../src/resolvers/Organization";
import { Query } from "../../src/resolvers/Query";
import { Subscription } from "../../src/resolvers/Subscription";
import { describe, it, beforeAll, expect } from "vitest";

let testResolver: Resolvers;

beforeAll(() => {
  testResolver = {
    DirectChat,
    DirectChatMessage,
    GroupChat,
    GroupChatMessage,
    MembershipRequest,
    Mutation,
    Organization,
    Query,
    Subscription,
  };
});

describe("resolvers -> index", () => {
  it("creates resolvers", () => {
    expect(testResolver).toStrictEqual(resolvers);
  });
});
