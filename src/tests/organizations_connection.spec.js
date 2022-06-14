const axios = require('axios');
const { URL } = require('../constants');
const getToken = require('./functions/getToken');
const shortid = require('shortid');

let token;

beforeAll(async () => {
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  token = await getToken(generatedEmail);
});

describe('Organizations Connection Resolvers', () => {
  let createdOrgId;

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
    );
    const { data } = createdOrgResponse;
    createdOrgId = data?.data.createOrganization._id;
    expect(data.data.createOrganization).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
      })
    );
  });

  test('Organizations Connection with Filter id', async () => {
    const orgConnectionResponse = await axios.post(
      URL,
      {
        query: `
                   query {
                        organizationsConnection(where: { id:"${createdOrgId}" }) {
                            _id
                            name
                            description
                            isPublic
                            visibleInSearch
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

    expect(
      orgConnectionResponse.data.data.organizationsConnection
    ).toHaveLength(1);

    expect(orgConnectionResponse.data.data.organizationsConnection[0]).toEqual(
      expect.objectContaining({
        _id: createdOrgId,
        name: expect.any(String),
        description: expect.any(String),
        isPublic: expect.any(Boolean),
        visibleInSearch: expect.any(Boolean),
      })
    );
  });

  test('Organizations Connection with Filter id_not', async () => {
    const orgConnectionResponse = await axios.post(
      URL,
      {
        query: `
                  query {
                    organizationsConnection(where:{id_not:"${createdOrgId}"}) {
                        _id
                        name
                        description
                        isPublic
                        visibleInSearch
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

    orgConnectionResponse.data?.data.organizationsConnection.forEach((org) => {
      expect(org).not.toEqual(
        expect.objectContaining({
          _id: createdOrgId,
          name: expect.any(String),
          description: expect.any(String),
          isPublic: expect.any(Boolean),
          visibleInSearch: expect.any(Boolean),
        })
      );
    });
  });

  test('Organizations Connection with Filter id_in', async () => {
    const orgConnectionResponse = await axios.post(
      URL,
      {
        query: `
                  query {
                    organizationsConnection(where:{id_in:"${createdOrgId}"}) {
                        _id
                        name
                        description
                        isPublic
                        visibleInSearch
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

    orgConnectionResponse.data?.data.organizationsConnection.forEach((org) => {
      expect(org).toEqual(
        expect.objectContaining({
          _id: createdOrgId,
          name: expect.any(String),
          description: expect.any(String),
          isPublic: expect.any(Boolean),
          visibleInSearch: expect.any(Boolean),
        })
      );
    });
  });

  test('Organizations Connection with Filter id_not_in', async () => {
    const orgConnectionResponse = await axios.post(
      URL,
      {
        query: `
                  query {
                    organizationsConnection(where:{id_not_in:"${createdOrgId}"}) {
                        _id
                        name
                        description
                        isPublic
                        visibleInSearch
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

    orgConnectionResponse.data?.data.organizationsConnection.forEach((org) => {
      expect(org).not.toEqual(
        expect.objectContaining({
          _id: createdOrgId,
          name: expect.any(String),
          description: expect.any(String),
          isPublic: expect.any(Boolean),
          visibleInSearch: expect.any(Boolean),
        })
      );
    });
  });

  test('Organizations Connection with Filters - isPublic, visibleInSearch', async () => {
    const orgConnectionResponse = await axios.post(
      URL,
      {
        query: `
                    query {
                        organizationsConnection(where: { isPublic: true, visibleInSearch: true }) {
                            _id
                            name
                            description
                            isPublic
                            visibleInSearch
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

    orgConnectionResponse.data.data.organizationsConnection.forEach((org) => {
      expect(org).toEqual(
        expect.objectContaining({
          name: expect.any(String),
          description: expect.any(String),
          isPublic: expect.any(Boolean),
          visibleInSearch: expect.any(Boolean),
        })
      );
    });
  });

  test('Organizations Connection with Parameter first=1', async () => {
    const orgConnectionResponse = await axios.post(
      URL,
      {
        query: `
                    query {
                        organizationsConnection(first:1) {
                            name
                            description
                            isPublic
                            visibleInSearch
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

    expect(
      orgConnectionResponse.data.data.organizationsConnection
    ).toHaveLength(1);

    expect(orgConnectionResponse.data.data.organizationsConnection[0]).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        description: expect.any(String),
        isPublic: expect.any(Boolean),
        visibleInSearch: expect.any(Boolean),
      })
    );
  });
});
