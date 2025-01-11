import * as fs from "fs";
import * as path from "path";

const filesystemTests = [
  "tests/directives/directiveTransformer/authDirectiveTransformer.spec.ts",
  "tests/directives/directiveTransformer/roleDirectiveTransformer.spec.ts",
  "tests/libraries/dbLogger.spec.ts",
  "tests/resolvers/ActionItemCategory/creator.spec.ts",
  "tests/resolvers/Advertisement/organization.spec.ts",
  "tests/resolvers/AgendaCategory/createdBy.spec.ts",
  "tests/resolvers/AgendaCategory/organization.spec.ts",
  "tests/resolvers/AgendaCategory/updatedBy.spec.ts",
  "tests/resolvers/AgendaItem/Users.spec.ts",
  "tests/resolvers/AgendaItem/categories.spec.ts",
  "tests/resolvers/AgendaItem/createdby.spec.ts",
  "tests/resolvers/AgendaItem/organization.spec.ts",
  "tests/resolvers/AgendaItem/relatedEvent.spec.ts",
  "tests/resolvers/AgendaItem/updatedBy.spec.ts",
  "tests/resolvers/AgendaSection/createdBy.spec.ts",
  "tests/resolvers/AgendaSection/items.spec.ts",
  "tests/resolvers/AgendaSection/relatedEvent.spec.ts",
  "tests/resolvers/Chat/admins.spec.ts",
  "tests/resolvers/Chat/creator.spec.ts",
  "tests/resolvers/Chat/messages.spec.ts",
  "tests/resolvers/Chat/organization.spec.ts",
  "tests/resolvers/Chat/users.spec.ts",
  "tests/resolvers/ChatMessage/chatMessageBelongsTo.spec.ts",
  "tests/resolvers/ChatMessage/replyTo.spec.ts",
  "tests/resolvers/ChatMessage/sender.spec.ts",
  "tests/resolvers/CheckIn/event.spec.ts",
  "tests/resolvers/CheckIn/user.spec.ts",
  "tests/resolvers/Comment/creator.spec.ts",
  "tests/resolvers/Event/actionItems.spec.ts",
  "tests/resolvers/Event/attendees.spec.ts",
  "tests/resolvers/Event/attendeesCheckInStatus.spec.ts",
  "tests/resolvers/Event/averageFeedbackScore.spec.ts",
  "tests/resolvers/Event/baseRecurringEvent.spec.ts",
  "tests/resolvers/Event/creator.spec.ts",
  "tests/resolvers/Event/feedback.spec.ts",
  "tests/resolvers/Event/organization.spec.ts",
  "tests/resolvers/Event/recurrenceRule.spec.ts",
  "tests/resolvers/Feedback/event.spec.ts",
  "tests/resolvers/Fund/creator.spec.ts",
  "tests/resolvers/FundCampaignPledges/users.spec.ts",
  "tests/resolvers/MembershipRequest/organization.spec.ts",
  "tests/resolvers/MembershipRequest/user.spec.ts",
  "tests/resolvers/Mutation/UpdateSessionTimeout.spec.ts",
  "tests/resolvers/Mutation/acceptMembershipRequest.spec.ts",
  "tests/resolvers/Mutation/addEventAttendee.spec.ts",
  "tests/resolvers/Mutation/addFeedback.spec.ts",
  "tests/resolvers/Mutation/addLanguageTranslation.spec.ts",
  "tests/resolvers/Mutation/addOrganizationCustomField.spec.ts",
  "tests/resolvers/Mutation/addOrganizationImage.spec.ts",
  "tests/resolvers/Mutation/addPeopleToUserTag.spec.ts",
  "tests/resolvers/Mutation/addPledgeToFundraisingCampaign.spec.ts",
  "tests/resolvers/Mutation/addUserCustomData.spec.ts",
  "tests/resolvers/Mutation/addUserImage.spec.ts",
  "tests/resolvers/Mutation/addUserToGroupChat.spec.ts",
  "tests/resolvers/Mutation/addUserToUserFamily.spec.ts",
  "tests/resolvers/Mutation/assignToUserTags.spec.ts",
  "tests/resolvers/Mutation/assignUserTag.spec.ts",
  "tests/resolvers/Mutation/blockPluginCreationBySuperadmin.spec.ts",
  "tests/resolvers/Mutation/blockUser.spec.ts",
  "tests/resolvers/Mutation/cancelMembershipRequest.spec.ts",
  "tests/resolvers/Mutation/checkIn.spec.ts",
  "tests/resolvers/Mutation/checkOut.spec.ts",
  "tests/resolvers/Mutation/createActionItem.spec.ts",
  "tests/resolvers/Mutation/createActionItemCategory.spec.ts",
  "tests/resolvers/Mutation/createAdmin.spec.ts",
  "tests/resolvers/Mutation/createAdvertisement.spec.ts",
  "tests/resolvers/Mutation/createAgendaCategory.spec.ts",
  "tests/resolvers/Mutation/createAgendaItem.spec.ts",
  "tests/resolvers/Mutation/createAgendaSection.spec.ts",
  "tests/resolvers/Mutation/createChat.spec.ts",
  "tests/resolvers/Mutation/createComment.spec.ts",
  "tests/resolvers/Mutation/createDonation.spec.ts",
  "tests/resolvers/Mutation/createEvent.spec.ts",
  "tests/resolvers/Mutation/createEventVolunteer.spec.ts",
  "tests/resolvers/Mutation/createEventVolunteerGroup.spec.ts",
  "tests/resolvers/Mutation/createFund.spec.ts",
  "tests/resolvers/Mutation/createFundCampaignPledge.spec.ts",
  "tests/resolvers/Mutation/createFundraisingCampaign.spec.ts",
  "tests/resolvers/Mutation/createMember.spec.ts",
  "tests/resolvers/Mutation/createNote.spec.ts",
  "tests/resolvers/Mutation/createOrganization.spec.ts",
  "tests/resolvers/Mutation/createPlugin.spec.ts",
  "tests/resolvers/Mutation/createPost.spec.ts",
  "tests/resolvers/Mutation/createSampleOrganization.spec.ts",
  "tests/resolvers/Mutation/createUserFamily.spec.ts",
  "tests/resolvers/Mutation/createUserTag.spec.ts",
  "tests/resolvers/Mutation/createVenue.spec.ts",
  "tests/resolvers/Mutation/createVolunteerMembership.spec.ts",
  "tests/resolvers/Mutation/deleteAdvertisement.spec.ts",
  "tests/resolvers/Mutation/deleteAgendaCategory.spec.ts",
  "tests/resolvers/Mutation/deleteDonationById.spec.ts",
  "tests/resolvers/Mutation/deleteNote.spec.ts",
  "tests/resolvers/Mutation/deleteVenue.spec.ts",
  "tests/resolvers/Mutation/editVenue.spec.ts",
  "tests/resolvers/Mutation/forgotPassword.spec.ts",
  "tests/resolvers/Mutation/inviteEventAttendee.spec.ts",
  "tests/resolvers/Mutation/joinPublicOrganization.spec.ts",
  "tests/resolvers/Mutation/leaveOrganization.spec.ts",
  "tests/resolvers/Mutation/likeComment.spec.ts",
  "tests/resolvers/Mutation/likePost.spec.ts",
  "tests/resolvers/Mutation/login.spec.ts",
  "tests/resolvers/Mutation/logout.spec.ts",
  "tests/resolvers/Mutation/markChatMessagesAsRead.spec.ts",
  "tests/resolvers/Mutation/otp.spec.ts",
  "tests/resolvers/Mutation/refreshToken.spec.ts",
  "tests/resolvers/Mutation/registerEventAttendee.spec.ts",
  "tests/resolvers/Mutation/registerForEvent.spec.ts",
  "tests/resolvers/Mutation/rejectMembershipRequest.spec.ts",
  "tests/resolvers/Mutation/removeActionItem.spec.ts",
  "tests/resolvers/Mutation/removeAdmin.spec.ts",
  "tests/resolvers/Mutation/removeAgendaItem.spec.ts",
  "tests/resolvers/Mutation/removeAgendaSection.spec.ts",
  "tests/resolvers/Mutation/removeComment.spec.ts",
  "tests/resolvers/Mutation/removeEvent.spec.ts",
  "tests/resolvers/Mutation/removeEventAttendee.spec.ts",
  "tests/resolvers/Mutation/removeEventVolunteer.spec.ts",
  "tests/resolvers/Mutation/removeEventVolunteerGroup.spec.ts",
  "tests/resolvers/Mutation/removeFromUserTags.spec.ts",
  "tests/resolvers/Mutation/removeFundCampaignPledge.spec.ts",
  "tests/resolvers/Mutation/removeMember.spec.ts",
  "tests/resolvers/Mutation/removeOrganization.spec.ts",
  "tests/resolvers/Mutation/removeOrganizationCustomField.spec.ts",
  "tests/resolvers/Mutation/removeOrganizationImage.spec.ts",
  "tests/resolvers/Mutation/removePost.spec.ts",
  "tests/resolvers/Mutation/removeSampleOrganization.spec.ts",
  "tests/resolvers/Mutation/removeUserCustomData.spec.ts",
  "tests/resolvers/Mutation/removeUserFamily.spec.ts",
  "tests/resolvers/Mutation/removeUserFromUserFamily.spec.ts",
  "tests/resolvers/Mutation/removeUserImage.spec.ts",
  "tests/resolvers/Mutation/removeUserTag.spec.ts",
  "tests/resolvers/Mutation/resetCommunity.spec.ts",
  "tests/resolvers/Mutation/revokeRefreshTokenForUser.spec.ts",
  "tests/resolvers/Mutation/saveFcmToken.spec.ts",
  "tests/resolvers/Mutation/sendMembershipRequest.spec.ts",
  "tests/resolvers/Mutation/sendMessageToChat.spec.ts",
  "tests/resolvers/Mutation/signUp.spec.ts",
  "tests/resolvers/Mutation/togglePostPin.spec.ts",
  "tests/resolvers/Mutation/unassignUserTag.spec.ts",
  "tests/resolvers/Mutation/unblockUser.spec.ts",
  "tests/resolvers/Mutation/unlikeComment.spec.ts",
  "tests/resolvers/Mutation/unlikePost.spec.ts",
  "tests/resolvers/Mutation/unregisterForEventByUser.spec.ts",
  "tests/resolvers/Mutation/updateActionItem.spec.ts",
  "tests/resolvers/Mutation/updateActionItemCategory.spec.ts",
  "tests/resolvers/Mutation/updateAdvertisement.spec.ts",
  "tests/resolvers/Mutation/updateAgendaCategory.spec.ts",
  "tests/resolvers/Mutation/updateAgendaItem.spec.ts",
  "tests/resolvers/Mutation/updateAgendaSection.spec.ts",
  "tests/resolvers/Mutation/updateChat.spec.ts",
  "tests/resolvers/Mutation/updateChatMessage.spec.ts",
  "tests/resolvers/Mutation/updateCommunity.spec.ts",
  "tests/resolvers/Mutation/updateEvent.spec.ts",
  "tests/resolvers/Mutation/updateEventVolunteer.spec.ts",
  "tests/resolvers/Mutation/updateEventVolunteerGroup.spec.ts",
  "tests/resolvers/Mutation/updateFund.spec.ts",
  "tests/resolvers/Mutation/updateFundCampaignPledge.spec.ts",
  "tests/resolvers/Mutation/updateFundraisingCampaign.spec.ts",
  "tests/resolvers/Mutation/updateLanguage.spec.ts",
  "tests/resolvers/Mutation/updateNote.spec.ts",
  "tests/resolvers/Mutation/updateOrganization.spec.ts",
  "tests/resolvers/Mutation/updatePluginStatus.spec.ts",
  "tests/resolvers/Mutation/updatePost.spec.ts",
  "tests/resolvers/Mutation/updateUserPassword.spec.ts",
  "tests/resolvers/Mutation/updateUserProfile.spec.ts",
  "tests/resolvers/Mutation/updateUserRoleInOrganization.spec.ts",
  "tests/resolvers/Mutation/updateUserTag.spec.ts",
  "tests/resolvers/Mutation/updateVolunteerMembership.spec.ts",
  "tests/resolvers/Organization/actionItemCategories.spec.ts",
  "tests/resolvers/Organization/admins.spec.ts",
  "tests/resolvers/Organization/advertisements.spec.ts",
  "tests/resolvers/Organization/agendaCategories.spec.ts",
  "tests/resolvers/Organization/blockedUsers.spec.ts",
  "tests/resolvers/Organization/creator.spec.ts",
  "tests/resolvers/Organization/funds.spec.ts",
  "tests/resolvers/Organization/image.spec.ts",
  "tests/resolvers/Organization/members.spec.ts",
  "tests/resolvers/Organization/membershipRequests.spec.ts",
  "tests/resolvers/Organization/pinnedPosts.spec.ts",
  "tests/resolvers/Organization/posts.spec.ts",
  "tests/resolvers/Organization/userTags.spec.ts",
  "tests/resolvers/Organization/venues.spec.ts",
  "tests/resolvers/Post/comments.spec.ts",
  "tests/resolvers/Post/creator.spec.ts",
  "tests/resolvers/Post/likedBy.spec.ts",
  "tests/resolvers/Query/actionItemCategoriesByOrganization.spec.ts",
  "tests/resolvers/Query/actionItemsByEvent.spec.ts",
  "tests/resolvers/Query/actionItemsByOrganization.spec.ts",
  "tests/resolvers/Query/actionItemsByUser.spec.ts",
  "tests/resolvers/Query/advertisementsConnection.spec.ts",
  "tests/resolvers/Query/agendaCategory.spec.ts",
  "tests/resolvers/Query/agendaItemByEvent.spec.ts",
  "tests/resolvers/Query/agendaItemById.spec.ts",
  "tests/resolvers/Query/agendaItemByOrganization.spec.ts",
  "tests/resolvers/Query/agendaItemCategoriesByOrganization.spec.ts",
  "tests/resolvers/Query/chatById.spec.ts",
  "tests/resolvers/Query/chatsByuserId.spec.ts",
  "tests/resolvers/Query/checkAuth.spec.ts",
  "tests/resolvers/Query/customDataByOrganization.spec.ts",
  "tests/resolvers/Query/customFieldsByOrganization.spec.ts",
  "tests/resolvers/Query/event.spec.ts",
  "tests/resolvers/Query/eventsAttendedByUser.spec.ts",
  "tests/resolvers/Query/eventsByOrganization.spec.ts",
  "tests/resolvers/Query/eventsByOrganizationConnection.spec.ts",
  "tests/resolvers/Query/fundsByOrganization.spec.ts",
  "tests/resolvers/Query/getAgendaSection.spec.ts",
  "tests/resolvers/Query/getAllAgendaItems.spec.ts",
  "tests/resolvers/Query/getAllNotesForAgendaItem.spec.ts",
  "tests/resolvers/Query/getCampaignPledgesById.spec.ts",
  "tests/resolvers/Query/getCommunityData.spec.ts",
  "tests/resolvers/Query/getDonationById.spec.ts",
  "tests/resolvers/Query/getDonationByOrgId.spec.ts",
  "tests/resolvers/Query/getDonationByOrgIdConnection.spec.ts",
  "tests/resolvers/Query/getEventAttendee.spec.ts",
  "tests/resolvers/Query/getEventAttendeesByEventId.spec.ts",
  "tests/resolvers/Query/getEventInvitesByUserId.spec.ts",
  "tests/resolvers/Query/getEventVolunteerGroups.spec.ts",
  "tests/resolvers/Query/getEventVolunteers.spec.ts",
  "tests/resolvers/Query/getFundById.spec.ts",
  "tests/resolvers/Query/getFundRaisingCampaigns.spec.ts",
  "tests/resolvers/Query/getGroupChatsByUserId.spec.ts",
  "tests/resolvers/Query/getNoteById.spec.ts",
  "tests/resolvers/Query/getPledgesByUserId.spec.ts",
  "tests/resolvers/Query/getPlugins.spec.ts",
  "tests/resolvers/Query/getRecurringEvents.spec.ts",
  "tests/resolvers/Query/getUnreadChatsByUserId.spec.ts",
  "tests/resolvers/Query/getUserTag.spec.ts",
  "tests/resolvers/Query/getVenueByOrgId.spec.ts",
  "tests/resolvers/Query/getVolunteerMembership.spec.ts",
  "tests/resolvers/Query/getVolunteerRanks.spec.ts",
  "tests/resolvers/Query/getlanguage.spec.ts",
  "tests/resolvers/Query/hasSubmittedFeedback.spec.ts",
  "tests/resolvers/Query/me.spec.ts",
  "tests/resolvers/Query/myLanguage.spec.ts",
  "tests/resolvers/Query/organizationIsSample.spec.ts",
  "tests/resolvers/Query/organizations.spec.ts",
  "tests/resolvers/Query/organizationsConnection.spec.ts",
  "tests/resolvers/Query/organizationsMemberConnection.spec.ts",
  "tests/resolvers/Query/post.spec.ts",
  "tests/resolvers/Query/registeredEventsByUser.spec.ts",
  "tests/resolvers/Query/user.spec.ts",
  "tests/resolvers/Query/userLanguage.spec.ts",
  "tests/resolvers/Query/users.spec.ts",
  "tests/resolvers/Query/usersConnection.spec.ts",
  "tests/resolvers/Query/venue.spec.ts",
  "tests/resolvers/RecurrenceRule/baseRecurringEvent.spec.ts",
  "tests/resolvers/RecurrenceRule/organization.spec.ts",
  "tests/resolvers/Subscription/messageSentToChat.spec.ts",
  "tests/resolvers/User/post.spec.ts",
  "tests/resolvers/User/tagsAssignedWith.spec.ts",
  "tests/resolvers/User/user.spec.ts",
  "tests/resolvers/UserFamily/admins.spec.ts",
  "tests/resolvers/UserFamily/creator.spec.ts",
  "tests/resolvers/UserFamily/users.spec.ts",
  "tests/resolvers/UserTag/ancestorTags.spec.ts",
  "tests/resolvers/UserTag/childTags.spec.ts",
  "tests/resolvers/UserTag/organization.spec.ts",
  "tests/resolvers/UserTag/parentTag.spec.ts",
  "tests/resolvers/UserTag/usersAssignedTo.spec.ts",
  "tests/resolvers/UserTag/usersToAssignTo.spec.ts",
  "tests/resolvers/middleware/currentUserExists.spec.ts",
  "tests/services/uploadFile.spec.ts",
  "tests/utilities/adminCheck.spec.ts",
  "tests/utilities/auth.spec.ts",
  "tests/utilities/checkReplicaSet.spec.ts",
  "tests/utilities/checks.spec.ts",
  "tests/utilities/createSampleOrganizationUtil.spec.ts",
  "tests/utilities/deletePreviousFile.spec.ts",
  "tests/utilities/encodedImageStorage/deletePreviousImage.spec.ts",
  "tests/utilities/encodedVideoStorage/deletePreviousVideo.spec.ts",
  "tests/utilities/imageAlreadyInDbCheck.spec.ts",
  "tests/utilities/removeSampleOrganizationUtil.spec.ts",
  "tests/utilities/reuploadDuplicateCheck.spec.ts",
  "tests/utilities/superAdminCheck.spec.ts",
  "tests/utilities/userFamilyAdminCheck.spec.ts",
];

function updateTestFile(filePath: string): void {
  console.log(`Processing file: ${filePath}`);

  let content = fs.readFileSync(filePath, "utf-8");
  console.log("Initial content:\n", content);

  // Add BaseTest import if not present
  if (!content.includes("import { BaseTest }")) {
    content = `import { BaseTest } from "../../helpers/testHelper/baseTest";\n${content}`;
  }

  // Add Vitest imports if not present
  if (!content.includes("import { describe, beforeAll, afterAll }")) {
    content = `import { test } from 'vitest';\n${content}`;
  }

  // // Add vi.setTimeout if not present
  // if (!content.includes("vi.setTimeout")) {
  //   content = `vi.setTimeout(15000);\n${content}`;
  // }

  // Add test instance and data declarations
  const testInstanceDeclaration = `
  let testInstance: BaseTest;
  let testData: {
    testUser: { name: string; email: string };
    testOrg: { name: string };
  };`;

  if (!content.includes("let testInstance: BaseTest")) {
    content = content.replace(
      /describe\([^{]*{/,
      `$&\n${testInstanceDeclaration}`,
    );
  }

  // Add BaseTest beforeAll hook if not present
  const baseTestBeforeAll = `
  beforeAll(async () => {
    testInstance = new BaseTest();
    try {
      testData = await testInstance.beforeEach();
    } catch (error) {
      console.error('Error in beforeAll:', error);
      throw error;
    }
  }, { timeout: 30000 });`;

  if (!content.includes("beforeAll(async () =>")) {
    content = content.replace(/describe\([^{]*{/, `$&\n${baseTestBeforeAll}`);
  }

  // Add BaseTest afterAll hook if not present
  const baseTestAfterAll = `
  afterAll(async () => {
    try {
      await testInstance.afterEach();
    } catch (error) {
      console.error('Error in afterAll:', error);
      throw error;
    }
  }, { timeout: 30000 });`;

  if (!content.includes("afterAll(async () =>")) {
    content = content.replace(/describe\([^{]*{/, `$&\n${baseTestAfterAll}`);
  }

  // Replace `describe.concurrent` with `describe`
  content = content.replace(/describe\.concurrent/g, "describe");

  // Replace `it.concurrent` with `test`
  content = content.replace(/it\.concurrent/g, "test");

  // Replace `it` with `test` and add correct syntax
  content = content.replace(/\bit\(/g, "test(");
  content = content.replace(
    /test\(['"](.*?)['"]\s*,\s*async\s*\([^)]*\)\s*=>\s*{/g,
    'test("$1", async () => {',
  );

  // Write updated content back to the file
  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`Updated file: ${filePath}`);
}

try {
  filesystemTests.forEach((test) => {
    const resolvedPath = path.resolve(test);
    if (fs.existsSync(resolvedPath)) {
      updateTestFile(resolvedPath);
    } else {
      console.error(`File not found: ${resolvedPath}`);
    }
  });
} catch (error) {
  console.error("Error updating files:", error);
}
