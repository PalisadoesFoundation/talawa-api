const Query = require('../../lib/resolvers/Query');

describe('Test from Query', () => {
  test('Query should have necessary properties', () => {
    expect(Query).toHaveProperty('me');
    expect(Query).toHaveProperty('user');
    expect(Query).toHaveProperty('users');
    expect(Query).toHaveProperty('usersConnection');

    expect(Query).toHaveProperty('checkAuth');

    expect(Query).toHaveProperty('organizations');
    expect(Query).toHaveProperty('organizationsConnection');
    expect(Query).toHaveProperty('organizationsMemberConnection');

    expect(Query).toHaveProperty('isUserRegister');
    expect(Query).toHaveProperty('event');
    expect(Query).toHaveProperty('events');
    expect(Query).toHaveProperty('registrantsByEvent');
    expect(Query).toHaveProperty('eventsByOrganization');
    expect(Query).toHaveProperty('registeredEventsByUser');

    expect(Query).toHaveProperty('groupChats');
    expect(Query).toHaveProperty('groupChatMessages');
    expect(Query).toHaveProperty('directChats');
    expect(Query).toHaveProperty('directChatMessages');
    expect(Query).toHaveProperty('directChatsByUserID');
    expect(Query).toHaveProperty('directChatsMessagesByChatID');

    expect(Query).toHaveProperty('tasksByEvent');
    expect(Query).toHaveProperty('tasksByUser');
    expect(Query).toHaveProperty('comments');
    expect(Query).toHaveProperty('commentsByPost');
    expect(Query).toHaveProperty('post');
    expect(Query).toHaveProperty('posts');
    expect(Query).toHaveProperty('postsByOrganization');
    expect(Query).toHaveProperty('postsByOrganizationConnection');
    expect(Query).toHaveProperty('groups');

    expect(Query).toHaveProperty('myLanguage');
    expect(Query).toHaveProperty('userLanguage');

    expect(Query).toHaveProperty('getlanguage');
    expect(Query).toHaveProperty('getPlugins');
  });
});
