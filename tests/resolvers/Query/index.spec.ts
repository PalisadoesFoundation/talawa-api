import { Query } from "../../../src/lib/resolvers/Query/index";
import { QueryResolvers } from "../../../src/generated/graphqlCodegen";
import { checkAuth } from "../../../src/lib/resolvers/Query/./checkAuth";
import { comments } from "../../../src/lib/resolvers/Query/./comments";
import { commentsByPost } from "../../../src/lib/resolvers/Query/./commentsByPost";
import { directChatMessages } from "../../../src/lib/resolvers/Query/./directChatMessages";
import { directChats } from "../../../src/lib/resolvers/Query/./directChats";
import { directChatsByUserID } from "../../../src/lib/resolvers/Query/./directChatsByUserID";
import { directChatsMessagesByChatID } from "../../../src/lib/resolvers/Query/./directChatsMessagesByChatID";
import { event } from "../../../src/lib/resolvers/Query/./event";
import { events } from "../../../src/lib/resolvers/Query/./events";
import { eventsByOrganization } from "../../../src/lib/resolvers/Query/./eventsByOrganization";
import { getDonationById } from "../../../src/lib/resolvers/Query/./getDonationById";
import { getDonationByOrgId } from "../../../src/lib/resolvers/Query/./getDonationByOrgId";
import { getDonations } from "../../../src/lib/resolvers/Query/./getDonations";
import { getlanguage } from "../../../src/lib/resolvers/Query/./getlanguage";
import { getPlugins } from "../../../src/lib/resolvers/Query/./getPlugins";
import { groupChatMessages } from "../../../src/lib/resolvers/Query/./groupChatMessages";
import { groupChats } from "../../../src/lib/resolvers/Query/./groupChats";
import { groups } from "../../../src/lib/resolvers/Query/./groups";
import { isUserRegister } from "../../../src/lib/resolvers/Query/./isUserRegister";
import { me } from "../../../src/lib/resolvers/Query/./me";
import { myLanguage } from "../../../src/lib/resolvers/Query/./myLanguage";
import { organizations } from "../../../src/lib/resolvers/Query/./organizations";
import { organizationsConnection } from "../../../src/lib/resolvers/Query/./organizationsConnection";
import { organizationsMemberConnection } from "../../../src/lib/resolvers/Query/./organizationsMemberConnection";
import { post } from "../../../src/lib/resolvers/Query/./post";
import { posts } from "../../../src/lib/resolvers/Query/./posts";
import { postsByOrganization } from "../../../src/lib/resolvers/Query/./postsByOrganization";
import { postsByOrganizationConnection } from "../../../src/lib/resolvers/Query/./postsByOrganizationConnection";
import { registeredEventsByUser } from "../../../src/lib/resolvers/Query/./registeredEventsByUser";
import { registrantsByEvent } from "../../../src/lib/resolvers/Query/./registrantsByEvent";
import { tasksByEvent } from "../../../src/lib/resolvers/Query/./tasksByEvent";
import { tasksByUser } from "../../../src/lib/resolvers/Query/./tasksByUser";
import { user } from "../../../src/lib/resolvers/Query/./user";
import { userLanguage } from "../../../src/lib/resolvers/Query/./userLanguage";
import { users } from "../../../src/lib/resolvers/Query/./users";
import { usersConnection } from "../../../src/lib/resolvers/Query/./usersConnection";
import { describe, it, beforeAll, expect } from "vitest";

let testResolver: QueryResolvers;

beforeAll(() => {
  testResolver = {
    checkAuth,
    comments,
    commentsByPost,
    directChatMessages,
    directChats,
    directChatsByUserID,
    directChatsMessagesByChatID,
    event,
    events,
    eventsByOrganization,
    getDonationById,
    getDonationByOrgId,
    getDonations,
    getlanguage,
    getPlugins,
    groupChatMessages,
    groupChats,
    groups,
    isUserRegister,
    me,
    myLanguage,
    organizations,
    organizationsConnection,
    organizationsMemberConnection,
    post,
    posts,
    postsByOrganization,
    postsByOrganizationConnection,
    registeredEventsByUser,
    registrantsByEvent,
    tasksByEvent,
    tasksByUser,
    user,
    userLanguage,
    users,
    usersConnection,
  };
});

describe("resolvers -> Query -> index", () => {
  it("creates resolvers", () => {
    expect(testResolver).toStrictEqual(Query);
  });
});
