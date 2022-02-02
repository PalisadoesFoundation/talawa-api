const axios = require('axios');
const { URL } = require('../constants');
const getToken = require('./functions/getToken');
const mongoose = require('mongoose');
const shortid = require('shortid');

let token;
beforeAll(async () => {
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  token = await getToken(generatedEmail);
});

describe('newsfeed resolvers', () => {
  test('posts', async () => {
    const response = await axios.post(URL, {
      query: `query {
                posts {
					_id
					text
					creator {
						firstName
						email
					}
					comments {
						text
						creator {
							firstName
						}
					}
					likedBy {
						firstName
					}
                }
            }`,
    });
    const { data } = response;
    expect(Array.isArray(data.data.posts)).toBeTruthy();
  });

  let createdPostId;
  let createdOrgId;
  test('Create Post', async () => {
    const newOrg = await axios.post(
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
								name
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

    createdOrgId = newOrg.data.data.createOrganization._id;

    const response = await axios.post(
      URL,
      {
        query: `
					mutation {
						createPost(
							data: {
								text: "Test Post",
								organizationId: "${createdOrgId}",
						}) {
							_id
							text
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
    const { data } = response;
    createdPostId = data.data.createPost._id;
    expect(data.data.createPost).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        text: expect.any(String),
      })
    );
  });

  test('Create Post without existing Organization', async () => {
    const dummyOrgId = new mongoose.Types.ObjectId();
    const response = await axios.post(
      URL,
      {
        query: `
					mutation {
						createPost(
							data: {
								text: "Test Post",
								organizationId: "${dummyOrgId}",
						}) {
							_id
							text
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

    expect(response.data.errors[0]).toEqual(
      expect.objectContaining({
        message: 'Organization not found',
        status: 422,
      })
    );

    expect(response.data.errors[0].data[0]).toEqual(
      expect.objectContaining({
        message: 'Organization not found',
        code: 'organization.notFound',
        param: 'organization',
        metadata: {},
      })
    );

    expect(response.data.data.createPost).toEqual(null);
  });

  test('Posts by Organization', async () => {
    const response = await axios.post(URL, {
      query: `query {
                postsByOrganization (id: "${createdOrgId}") {
					_id
					text
					creator {
						firstName
						email
					}
					likedBy {
						firstName
					}
                }
            }`,
    });
    const { data } = response;
    expect(Array.isArray(data.data.postsByOrganization)).toBeTruthy();
  });

  test('Remove Post', async () => {
    // a new organization is created then deleted
    const response = await axios.post(
      URL,
      {
        query: `
				mutation {
					createPost(
						data: {
							text: "Test",
							organizationId: "${createdOrgId}",
					}) {
						_id
						text
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

    const newPostId = response.data.data.createPost._id;

    const deletedResponse = await axios.post(
      URL,
      {
        query: `
	            mutation {
	                removePost(id: "${newPostId}") {
	                    _id
	                    text
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

    expect(deletedResponse.data).toMatchObject({
      data: {
        removePost: {
          _id: `${newPostId}`,
          text: 'Test',
        },
      },
    });
  });

  test('Like Post', async () => {
    const response = await axios.post(
      URL,
      {
        query: `
				mutation {
					likePost(
						id: "${createdPostId}"
					) {
						_id
						text
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
    const { data } = response;
    expect(data.data.likePost).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        text: expect.any(String),
      })
    );
  });

  test('Unlike Post', async () => {
    const response = await axios.post(
      URL,
      {
        query: `
				mutation {
					unlikePost(
						id: "${createdPostId}"
					) {
						_id
						text
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
    const { data } = response;
    expect(data.data.unlikePost).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        text: expect.any(String),
      })
    );
  });

  // Comments

  test('Comments by Post', async () => {
    const response = await axios.post(URL, {
      query: `query {
					commentsByPost (id: "${createdPostId}"){
						text
					}
	            }`,
    });
    const { data } = response;
    expect(Array.isArray(data.data.commentsByPost)).toBeTruthy();
  });
  let createdCommentId;
  test('Create Comment', async () => {
    const response = await axios.post(
      URL,
      {
        query: `
				mutation {
					createComment(
						postId: "${createdPostId}",
						data: {
							text: "This is my first comment!",
					}) {
						_id
						text
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
    const { data } = response;
    createdCommentId = data.data.createComment._id;
    expect(data.data.createComment).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        text: expect.any(String),
      })
    );
  });

  test('Like Comment', async () => {
    const response = await axios.post(
      URL,
      {
        query: `
							mutation {
								likeComment(
									id: "${createdCommentId}"
								) {
									_id
									text
									likeCount
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
    const { data } = response;
    expect(data.data.likeComment).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        text: expect.any(String),
        likeCount: expect.any(Number),
      })
    );
  });

  test('Unlike Comment', async () => {
    const response = await axios.post(
      URL,
      {
        query: `
							mutation {
								unlikeComment(
									id: "${createdCommentId}"
								) {
									_id
									text
									likeCount
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
    const { data } = response;
    expect(data.data.unlikeComment).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        text: expect.any(String),
        likeCount: expect.any(Number),
      })
    );
  });

  test('Remove Comment', async () => {
    const response = await axios.post(
      URL,
      {
        query: `
				mutation {
					createComment(
						postId: "${createdPostId}",
						data: {
							text: "Comment to be deleted",
					}) {
						_id
						text
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

    const newCommentId = response.data.data.createComment._id;

    const deletedResponse = await axios.post(
      URL,
      {
        query: `
	            mutation {
					removeComment(id: "${newCommentId}") {
	                    _id
	                    text
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

    expect(deletedResponse.data).toMatchObject({
      data: {
        removeComment: {
          _id: `${newCommentId}`,
          text: 'Comment to be deleted',
        },
      },
    });
  });
});
