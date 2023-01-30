import { Query } from "../../../src/resolvers/Query/index";
import { QueryResolvers } from "../../../src/types/generatedGraphQLTypes";
import { checkAuth } from "../../../src/resolvers/Query/./checkAuth";
import { comments } from "../../../src/resolvers/Query/./comments";
import { commentsByPost } from "../../../src/resolvers/Query/./commentsByPost";
import { directChatMessages } from "../../../src/resolvers/Query/./directChatMessages";
import { directChats } from "../../../src/resolvers/Query/./directChats";
import { directChatsByUserID } from "../../../src/resolvers/Query/./directChatsByUserID";
import { directChatsMessagesByChatID } from "../../../src/resolvers/Query/./directChatsMessagesByChatID";
import { event } from "../../../src/resolvers/Query/./event";
import { events } from "../../../src/resolvers/Query/./events";
import { eventsByOrganization } from "../../../src/resolvers/Query/./eventsByOrganization";
import { getDonationById } from "../../../src/resolvers/Query/./getDonationById";
import { getDonationByOrgId } from "../../../src/resolvers/Query/./getDonationByOrgId";
import { getDonations } from "../../../src/resolvers/Query/./getDonations";
import { getlanguage } from "../../../src/resolvers/Query/./getlanguage";
import { getPlugins } from "../../../src/resolvers/Query/./getPlugins";
import { groupChatMessages } from "../../../src/resolvers/Query/./groupChatMessages";
import { groupChats } from "../../../src/resolvers/Query/./groupChats";
import { groups } from "../../../src/resolvers/Query/./groups";
import { isUserRegister } from "../../../src/resolvers/Query/./isUserRegister";
import { me } from "../../../src/resolvers/Query/./me";
import { myLanguage } from "../../../src/resolvers/Query/./myLanguage";
import { organizations } from "../../../src/resolvers/Query/./organizations";
import { organizationsConnection } from "../../../src/resolvers/Query/./organizationsConnection";
import { organizationsMemberConnection } from "../../../src/resolvers/Query/./organizationsMemberConnection";
import { post } from "../../../src/resolvers/Query/./post";
import { posts } from "../../../src/resolvers/Query/./posts";
import { postsByOrganization } from "../../../src/resolvers/Query/./postsByOrganization";
import { postsByOrganizationConnection } from "../../../src/resolvers/Query/./postsByOrganizationConnection";
import { registeredEventsByUser } from "../../../src/resolvers/Query/./registeredEventsByUser";
import { registrantsByEvent } from "../../../src/resolvers/Query/./registrantsByEvent";
import { tasksByEvent } from "../../../src/resolvers/Query/./tasksByEvent";
import { tasksByUser } from "../../../src/resolvers/Query/./tasksByUser";
import { user } from "../../../src/resolvers/Query/./user";
import { userLanguage } from "../../../src/resolvers/Query/./userLanguage";
import { users } from "../../../src/resolvers/Query/./users";
import { usersConnection } from "../../../src/resolvers/Query/./usersConnection";
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
