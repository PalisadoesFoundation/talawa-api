/* eslint-disable jest/no-conditional-expect */
/* eslint-disable no-fallthrough */
/* eslint-disable no-undef */
'use strict';

var axios = require('axios');

var shortid = require('shortid');

var _require = require('../constants'),
  URL = _require.URL;

var getToken = require('./functions/getToken');

var getUserId = require('./functions/getUserId');

var token;
var loggedInUserId;

const condition = 1;

beforeAll(function _callee() {
  return regeneratorRuntime.async(function _callee$(_context) {
    while (condition) {
      switch ((_context.prev = _context.next)) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(getToken());

        case 2:
          token = _context.sent;
          _context.next = 5;
          return regeneratorRuntime.awrap(getUserId());

        case 5:
          loggedInUserId = _context.sent;

        case 6:
        case 'end':
          return _context.stop();
      }
    }
  });
});
describe('chat resolvers', function () {
  var createdGroupChatId;
  var createdDirectChatId;
  var createdOrgId;
  test('create direct chat', function _callee2() {
    var createdOrgResponse,
      nameForNewUser,
      email,
      createNewUserResponse,
      signUpData,
      newUserId,
      createDirectChatResponse,
      createDirectChatData;
    return regeneratorRuntime.async(function _callee2$(_context2) {
      while (condition) {
        switch ((_context2.prev = _context2.next)) {
          case 0:
            _context2.next = 2;
            return regeneratorRuntime.awrap(
              axios.post(
                URL,
                {
                  query: `
                    mutation {
                      createOrganization(
                        data: {
                          name:"test org"
                          description:"test description"
                          isPublic: true
                          visibleInSearch: true
                        }) {
                          _id
                        }
                      }
                    `,
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              )
            );

          case 2:
            createdOrgResponse = _context2.sent;
            createdOrgId = createdOrgResponse.data.data.createOrganization._id; // CREATE A NEW USER

            nameForNewUser = shortid.generate();
            email = `${nameForNewUser}@test.com`;
            _context2.next = 8;
            return regeneratorRuntime.awrap(
              axios.post(URL, {
                query: `mutation {
                  signUp(data: {
                    firstName: ${nameForNewUser}
                    lastName: ${nameForNewUser}
                    email: ${email}
                    password:"password"
                  }) {
                    user{
                      _id
                    }
                    accessToken
                  }
                }`,
              })
            );

          case 8:
            createNewUserResponse = _context2.sent;
            signUpData = createNewUserResponse.data;
            newUserId = signUpData.data.signUp.user._id; // CREATE DIRECT CHAT

            _context2.next = 13;
            return regeneratorRuntime.awrap(
              axios.post(
                URL,
                {
                  query: `
                  mutation{
                    createDirectChat(
                      data: {
                        organizationId:${createdOrgId}"
                        userIds:  [
                          ${loggedInUserId}
                          ${newUserId}
                        ]
                      }) {
                        _id
                      }
                    }`,
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              )
            );

          case 13:
            createDirectChatResponse = _context2.sent;
            createDirectChatData = createDirectChatResponse.data;
            createdDirectChatId =
              createDirectChatData.data.createDirectChat._id;
            expect(createDirectChatData.data.createDirectChat).toEqual(
              expect.objectContaining({
                _id: expect.any(String),
              })
            );

          case 17:
          case 'end':
            return _context2.stop();
        }
      }
    });
  }); // SEND A MESSAGE TO A DIRECT CHAT

  test('send message to direct chat', function _callee3() {
    var sendMessageToDirectChatResponse, sendMessageToADirectChatData;
    return regeneratorRuntime.async(function _callee3$(_context3) {
      while (condition) {
        switch ((_context3.prev = _context3.next)) {
          case 0:
            _context3.next = 2;
            return regeneratorRuntime.awrap(
              axios.post(
                URL,
                {
                  query: `
                  mutation{
                    sendMessageToDirectChat(
                      chatId: ${createdDirectChatId}"
                      messageContent: "this is a test message"
                    ) {
                      _id
                    }
                  }`,
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              )
            );

          case 2:
            sendMessageToDirectChatResponse = _context3.sent;
            sendMessageToADirectChatData = sendMessageToDirectChatResponse.data;
            console.log(sendMessageToADirectChatData);
            // eslint-disable-next-line jest/no-conditional-expect
            expect(
              sendMessageToADirectChatData.data.sendMessageToDirectChat
            ).toEqual(
              expect.objectContaining({
                _id: expect.any(String),
              })
            );

          case 6:
          case 'end':
            return _context3.stop();
        }
      }
    });
  }); // REMOVE DIRECT CHAT

  test('remove direct chat', function _callee4() {
    var removeDirectChatResponse, removeDirectChatData;
    return regeneratorRuntime.async(function _callee4$(_context4) {
      while (condition) {
        switch ((_context4.prev = _context4.next)) {
          case 0:
            _context4.next = 2;
            return regeneratorRuntime.awrap(
              axios.post(
                URL,
                {
                  query: `
                    mutation {
                    removeDirectChat(
                      chatId:${createdDirectChatId}
                      organizationId: ${createdOrgId}
                    ) {
                      _id
                    }
                  }`,
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              )
            );

          case 2:
            removeDirectChatResponse = _context4.sent;
            removeDirectChatData = removeDirectChatResponse.data;
            expect(removeDirectChatData.data.removeDirectChat).toEqual(
              expect.objectContaining({
                _id: expect.any(String),
              })
            );

          case 5:
          case 'end':
            return _context4.stop();
        }
      }
    });
  }); // CREATE GROUP CHAT

  test('create group chat', function _callee5() {
    var nameForNewUser,
      email,
      createNewUserResponse,
      signUpData,
      newUserId,
      createGroupChatResponse,
      createGroupChatData;
    return regeneratorRuntime.async(function _callee5$(_context5) {
      while (condition) {
        switch ((_context5.prev = _context5.next)) {
          case 0:
            nameForNewUser = shortid.generate();
            email = ''.concat(nameForNewUser, '@test.com');
            _context5.next = 4;
            return regeneratorRuntime.awrap(
              axios.post(URL, {
                query: `
                mutation {
                  signUp(data: {
                    firstName: ${nameForNewUser}
                    lastName: ${nameForNewUser}
                    email: ${email}
                    password:"password"
                   }) {
                     user{
                        _id
                      }
                      accessToken
                    }
                }`,
              })
            );

          case 4:
            createNewUserResponse = _context5.sent;
            signUpData = createNewUserResponse.data;
            newUserId = signUpData.data.signUp.user._id;
            _context5.next = 9;
            return regeneratorRuntime.awrap(
              axios.post(
                URL,
                {
                  query: `
                  mutation{
                    createGroupChat(data: {
                      title: "This is a group chat for testing"
                      organizationId: {createdOrgId}
                      userIds: [
                        ${loggedInUserId}
                        ${newUserId}
                      ]
                    }) {
                      _id
                    }
                  }`,
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              )
            );

          case 9:
            createGroupChatResponse = _context5.sent;
            createGroupChatData = createGroupChatResponse.data;
            createdGroupChatId = createGroupChatData.data.createGroupChat._id;
            expect(createGroupChatData.data.createGroupChat).toEqual(
              expect.objectContaining({
                _id: expect.any(String),
              })
            );

          case 13:
          case 'end':
            return _context5.stop();
        }
      }
    });
  }); // SEND MESSAGE TO GROUP CHAT

  test('send message to group chat', function _callee6() {
    var sendMessageToGroupChatResponse, sendMessageToAGroupChatData;
    return regeneratorRuntime.async(function _callee6$(_context6) {
      while (condition) {
        switch ((_context6.prev = _context6.next)) {
          case 0:
            _context6.next = 2;
            return regeneratorRuntime.awrap(
              axios.post(
                URL,
                {
                  query: `
                  mutation{
                    sendMessageToGroupChat(
                      chatId: $createdGroupChatId}
                      messageContent:  "this is a test message"
                    ) {
                      _id
                    }
                  }`,
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              )
            );

          case 2:
            sendMessageToGroupChatResponse = _context6.sent;
            sendMessageToAGroupChatData = sendMessageToGroupChatResponse.data;
            expect(
              sendMessageToAGroupChatData.data.sendMessageToGroupChat
            ).toEqual(
              expect.objectContaining({
                _id: expect.any(String),
              })
            );

          case 5:
          case 'end':
            return _context6.stop();
        }
      }
    });
  }); // REMOVE GROUP CHAT

  test('remove group chat', function _callee7() {
    var removeGroupChatResponse, removeGroupChatData;
    return regeneratorRuntime.async(function _callee7$(_context7) {
      while (condition) {
        switch ((_context7.prev = _context7.next)) {
          case 0:
            _context7.next = 2;
            return regeneratorRuntime.awrap(
              axios.post(
                URL,
                {
                  query: `
                  mutation{
                    removeGroupChat(
                      chatId:${createdGroupChatId}"
                    ) {
                      _id
                    }
                  }
                `,
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              )
            );

          case 2:
            removeGroupChatResponse = _context7.sent;
            removeGroupChatData = removeGroupChatResponse.data;
            expect(removeGroupChatData.data.removeGroupChat).toEqual(
              expect.objectContaining({
                _id: expect.any(String),
              })
            );

          case 5:
          case 'end':
            return _context7.stop();
        }
      }
    });
  });
});
