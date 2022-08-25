const Mutation = require('../../lib/resolvers/Mutation');

describe('Test for Mutation', () => {
  test('Mutation should have necessary properties', () => {
    expect(Mutation).toHaveProperty('signUp');
    expect(Mutation).toHaveProperty('login');
    expect(Mutation).toHaveProperty('saveFcmToken');
    expect(Mutation).toHaveProperty('logout');
    expect(Mutation).toHaveProperty('refreshToken');
    expect(Mutation).toHaveProperty('revokeRefreshTokenForUser');
    expect(Mutation).toHaveProperty('updateLanguage');

    expect(Mutation).toHaveProperty('updateUserProfile');
    expect(Mutation).toHaveProperty('createOrganization');

    expect(Mutation).toHaveProperty('createEvent');
    expect(Mutation).toHaveProperty('registerForEvent');
    expect(Mutation).toHaveProperty('removeEvent');
    expect(Mutation).toHaveProperty('removeEvent');
    expect(Mutation).toHaveProperty('unregisterForEventByUser');

    expect(Mutation).toHaveProperty('createAdmin');
    expect(Mutation).toHaveProperty('removeAdmin');
    expect(Mutation).toHaveProperty('updateOrganization');
    expect(Mutation).toHaveProperty('removeOrganization');
    expect(Mutation).toHaveProperty('joinPublicOrganization');
    expect(Mutation).toHaveProperty('leaveOrganization');
    expect(Mutation).toHaveProperty('removeMember');

    expect(Mutation).toHaveProperty('adminRemovePost');
    expect(Mutation).toHaveProperty('adminRemoveGroup');
    expect(Mutation).toHaveProperty('adminRemoveEvent');

    expect(Mutation).toHaveProperty('createPost');
    expect(Mutation).toHaveProperty('removePost');
    expect(Mutation).toHaveProperty('likePost');
    expect(Mutation).toHaveProperty('unlikePost');
    expect(Mutation).toHaveProperty('createTask');
    expect(Mutation).toHaveProperty('removeTask');
    expect(Mutation).toHaveProperty('updateTask');
    expect(Mutation).toHaveProperty('sendMembershipRequest');
    expect(Mutation).toHaveProperty('acceptMembershipRequest');
    expect(Mutation).toHaveProperty('rejectMembershipRequest');
    expect(Mutation).toHaveProperty('cancelMembershipRequest');

    expect(Mutation).toHaveProperty('blockUser');
    expect(Mutation).toHaveProperty('unblockUser');

    expect(Mutation).toHaveProperty('createComment');
    expect(Mutation).toHaveProperty('removeComment');
    expect(Mutation).toHaveProperty('likeComment');
    expect(Mutation).toHaveProperty('unlikeComment');

    expect(Mutation).toHaveProperty('addUserImage');
    expect(Mutation).toHaveProperty('removeUserImage');
    expect(Mutation).toHaveProperty('addOrganizationImage');
    expect(Mutation).toHaveProperty('removeOrganizationImage');

    expect(Mutation).toHaveProperty('removeOrganizationImage');
    expect(Mutation).toHaveProperty('removeDirectChat');
    expect(Mutation).toHaveProperty('sendMessageToDirectChat');

    expect(Mutation).toHaveProperty('createGroupChat');
    expect(Mutation).toHaveProperty('removeGroupChat');
    expect(Mutation).toHaveProperty('sendMessageToGroupChat');
    expect(Mutation).toHaveProperty('addUserToGroupChat');
    expect(Mutation).toHaveProperty('removeUserFromGroupChat');
    expect(Mutation).toHaveProperty('blockPluginCreationBySuperadmin');

    expect(Mutation).toHaveProperty('createMessageChat');
    expect(Mutation).toHaveProperty('addLanguageTranslation');

    expect(Mutation).toHaveProperty('createPlugin');
    expect(Mutation).toHaveProperty('updatePluginStatus');
    expect(Mutation).toHaveProperty('updatePluginInstalledOrgs');
  });
});
