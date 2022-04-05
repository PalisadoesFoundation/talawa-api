const axios = require('axios');
const { URL } = require('../../../constants');
const getToken = require('../../functions/getToken');
const shortid = require('shortid');
const updateOrganization = require('../../../lib/resolvers/organization_mutations/updateOrganization');
const database = require('../../../db');
const mongoose = require('mongoose');

beforeAll(async () => {
    let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
    token = await getToken(generatedEmail);
    require('dotenv').config(); // pull env variables from .env file
    await database.connect();  // connect the database before running any test in this file's scope
});

afterAll(() => {
  database.disconnect(); // disconnect the database after running every test in this file's scope
});

describe('organization resolvers', () => {

    const isPublic_boolean = Math.random() < 0.5;
    const visibleInSearch_boolean = Math.random() < 0.5;
    var createdOrgId;
    var newUserId = mongoose.Types.ObjectId();

    // test for creating organization 
    test('createOrganization', async () => {
        const createdOrgResponse = await axios.post(
            URL,
            {
              query: `
                    mutation {
                        createOrganization(data: {
                            name:"test org"
                            description:"test description"
                            isPublic: true
                            visibleInSearch: true
                            apiUrl : "test url"
                            }) {
                                _id,
                                name, 
                                description,
                                creator{
                                  email
                                },
                                admins{
                                  email
                                },
                                members{
                                  email
                                }
                            }
                    }
                      `,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const { data } = createdOrgResponse;
          createdOrgId = createdOrgResponse.data.data.createOrganization._id;
          expect(data.data.createOrganization).toEqual(
            expect.objectContaining({
              _id: expect.any(String),
              name: expect.any(String),
              description: expect.any(String),
              creator: expect.objectContaining({
                email: expect.any(String),
              }),
              admins: expect.any(Array),
              members: expect.any(Array),
            })
          );
    });

    // test for if no organization found, throw an error
    test('if no organization is found for the provided args.id, throws NotFoundError', async () => {
        // Random id to pass as chat id
        const args = { id: mongoose.Types.ObjectId() };
        const context = {
            userId: mongoose.Types.ObjectId()
        }
        await expect(async () => {
          await updateOrganization({}, args, context);
        }).rejects.toEqual(Error('Organization not found'));
      });

    // test for update organization
    test('updateOrganization', async () => {
        const updateOrgRes = await axios.post(
            URL,
            {
              query: `
                mutation {
                  updateOrganization(
                    id: "${createdOrgId}"
                    data: {
                      name: "test2 org"
                      description: "new description"
                      isPublic: ${!isPublic_boolean}
                      visibleInSearch: ${!visibleInSearch_boolean}
                    }
                  ) {
                    _id
                    name
                    description
                    isPublic
                    visibleInSearch
                    apiUrl
                    image
                    creator {
                      _id
                      firstName
                    }
                    members {
                      _id
                      firstName
                    }
                    admins {
                      _id
                      firstName
                    }
                    membershipRequests {
                      _id
                      organization{
                        _id
                        name
                        description
                      }
                      user {
                        _id
                        firstName
                      }
                    }
                    blockedUsers {
                      _id
                      firstName
                    }
                  }
                }
              `,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
        );
        const args = {          
          id: createdOrgId,
          data: {
            name: "test2 org",
            description: "new description",
            isPublic: `${!isPublic_boolean}`,
            visibleInSearch: `${!visibleInSearch_boolean}`,
          }
        }
        const userId = updateOrgRes.data.data.updateOrganization.admins[0]._id;
        const context = {
          userId: userId
        }
      const response = await updateOrganization({}, args, context);   // passing parameters to original function
  
      expect(response).toEqual(
        expect.objectContaining({
            name: 'test2 org',
            description: 'new description',
        })
      );
    });
  });
  