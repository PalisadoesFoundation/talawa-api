const axios = require('axios');
const { URL } = require('../constants');
const getToken = require('./functions/getToken');
const getUserId = require('./functions/getUserId');
const shortid = require('shortid');

let token;
let userId;
beforeAll(async () => {
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  token = await getToken(generatedEmail);
  userId = await getUserId(generatedEmail);
});
describe('event resolvers', () => {
  let createdEventId;
  let createdOrgId;
  test('createEvent', async () => {
    const newOrg = await axios.post(
      URL,
      {
        query: `
          mutation {
            createOrganization(
              data: {
                name: "test org"
                description: "test description2"
                isPublic: true
                visibleInSearch: true
              }
            ) {
              _id
              name
            }
          }`,
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
            createEvent(
              data: {
                title: "Talawa Conference Test"
                description: "National conference that happens yearly"
                isPublic: true
                isRegisterable: true
                recurring: true
                recurrance: YEARLY
                location: "Test"
                startDate: "2/2/2020"
                allDay: true
                endTime: "2:00 PM"
                startTime: "1:00 PM"
                organizationId: "${createdOrgId}"
              }
            ) {
              _id
              title
              description
              startDate
              startTime
              endTime
              allDay
              recurring
              recurrance
              isPublic
              isRegisterable
              location
              status
              organization {
                _id
              }
              creator {
                _id
              }
              admins {
                _id
              }
            }
          }`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const { data } = response;
    createdEventId = data.data.createEvent._id;
    const createdEvent = data.data.createEvent;
    expect(createdEvent).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        title: 'Talawa Conference Test',
        description: 'National conference that happens yearly',
        startDate: '2/2/2020',
        startTime: '1:00 PM',
        endTime: '2:00 PM',
        allDay: true,
        recurring: true,
        recurrance: 'YEARLY',
        isPublic: true,
        isRegisterable: true,
        location: 'Test',
        status: 'ACTIVE',
      })
    );

    expect(createdEvent.organization).toEqual(
      expect.objectContaining({
        _id: createdOrgId,
      })
    );

    expect(createdEvent.creator).toEqual(
      expect.objectContaining({
        _id: userId,
      })
    );

    createdEvent.admins.map((admin) => {
      expect(admin).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
        })
      );
    });
  });

  test('allEvents', async () => {
    const response = await axios.post(URL, {
      query: `{
        events {
          _id
          title
          description
          startDate
          startTime
          endTime
          allDay
          recurring
          recurring
          recurrance
          isPublic
          isRegisterable
          location
          status
          registrants{
            _id
            user{
              _id
            }
          }
        }
      }`,
    });
    const { data } = response;
    const eventsData = data.data.events;
    expect(Array.isArray(eventsData)).toBeTruthy();

    eventsData.map((event) => {
      expect(event).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          title: expect.any(String),
          description: expect.any(String),
          startDate: expect.any(String),
          startTime: expect.any(String),
          endTime: expect.any(String),
          allDay: expect.any(Boolean),
          recurring: expect.any(Boolean),
          recurrance: expect.any(String),
          isPublic: expect.any(Boolean),
          isRegisterable: expect.any(Boolean),
          location: expect.any(String),
          status: expect.any(String),
        })
      );
      event.registrants.map((registrant) => {
        expect(registrant).toEqual(
          expect.objectContaining({
            _id: expect.any(String),
            user: expect.objectContaining({
              _id: expect.any(String),
            }),
          })
        );
      });
    });
  });

  test('eventsByOrganization', async () => {
    const response = await axios.post(URL, {
      query: `query {
                eventsByOrganization (id: "${createdOrgId}") {
                    _id
                    title
                }
            }`,
    });
    const { data } = response;
    expect(Array.isArray(data.data.eventsByOrganization)).toBeTruthy();
    expect(data.data.eventsByOrganization).toHaveLength(1);
  });

  test('eventByID', async () => {
    const response = await axios.post(
      URL,
      {
        query: `
        query {
          event (id: "${createdEventId}"){
            _id
            title
            description
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
    expect(data.data.event).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        title: expect.any(String),
        description: expect.any(String),
      })
    );
  });

  test('check if user is Registered for event', async () => {
    const response = await axios.post(
      URL,
      {
        query: `{
          isUserRegister(eventId: "${createdEventId}") {
            event {
              _id
            }
            isRegistered
          }
        }`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const { data } = response;
    const isUserRegistered = data.data.isUserRegister;
    expect(isUserRegistered.event).toEqual(
      expect.objectContaining({
        _id: createdEventId,
      })
    );
    expect(isUserRegistered.isRegistered).toEqual(true);
  });

  test('check all registered events by user', async () => {
    const response = await axios.post(
      URL,
      {
        query: `{
          registeredEventsByUser(id: "${userId}") {
            _id
            title
            description
          }
        }`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const { data } = response;
    const registeredEventsByUserData = data.data.registeredEventsByUser;
    expect(Array.isArray(registeredEventsByUserData)).toBeTruthy();

    registeredEventsByUserData.map((event) => {
      expect(event).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          title: expect.any(String),
          description: expect.any(String),
        })
      );
    });
  });

  test('registerForEvent if already registered', async () => {
    const response = await axios.post(
      URL,
      {
        query: `
	        mutation {
	          registerForEvent(id: "${createdEventId}") {
	            _id
	            title
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
    expect(Array.isArray(data.errors)).toBeTruthy();

    expect(data.errors[0]).toEqual(
      expect.objectContaining({
        message: 'Already registered for the event',
        status: 422,
      })
    );

    expect(data.errors[0].data[0]).toEqual(
      expect.objectContaining({
        message: 'Already registered for the event',
        code: 'registrant.alreadyExist',
        param: 'registrant',
        metadata: {},
      })
    );

    expect(data.data).toEqual(null);
  });

  test('unregisterForEventByUser', async () => {
    const response = await axios.post(
      URL,
      {
        query: `
        mutation{
          unregisterForEventByUser(id:"${createdEventId}"){
            _id
            title
            description
            registrants{
              _id
            }
          }
        }`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const { data } = response;

    expect(data.data.unregisterForEventByUser).toEqual(
      expect.objectContaining({
        _id: createdEventId,
        title: 'Talawa Conference Test',
        description: 'National conference that happens yearly',
      })
    );
  });

  test('registerForEvent after unregistering', async () => {
    const response = await axios.post(
      URL,
      {
        query: `
	        mutation {
	          registerForEvent(id: "${createdEventId}") {
	            _id
	            title
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

    expect(data.data.registerForEvent).toEqual(
      expect.objectContaining({
        _id: createdEventId,
        title: 'Talawa Conference Test',
      })
    );
  });

  test('registrantsByEvent', async () => {
    const response = await axios.post(URL, {
      query: `query {
                registrantsByEvent (id: "${createdEventId}") {
					firstName
					email
                }
            }`,
    });
    const { data } = response;
    expect(Array.isArray(data.data.registrantsByEvent)).toBeTruthy();
  });

  test('updateEvent', async () => {
    const response = await axios.post(
      URL,
      {
        query: `
	        mutation {
	          updateEvent(id: "${createdEventId}", data: {
	              title: "Talawa Congress"
	          }) {
	              _id
	              title
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
    expect(data).toMatchObject({
      data: {
        updateEvent: {
          _id: `${createdEventId}`,
          title: 'Talawa Congress',
        },
      },
    });
  });

  // Event Task

  let createdTaskId;
  test('createTask', async () => {
    const response = await axios.post(
      URL,
      {
        query: `
			  mutation {
				createTask(
					data: {
						title: "Task",
				}, eventId: "${createdEventId}") {
					_id
					title
					description
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
    createdTaskId = data.data.createTask._id;
    expect(data).toMatchObject({
      data: {
        createTask: {
          _id: `${createdTaskId}`,
          title: 'Task',
        },
      },
    });
  });

  test('updateTask', async () => {
    const response = await axios.post(
      URL,
      {
        query: `
	        mutation {
	          updateTask(id: "${createdTaskId}", data: {
	              title: "Updated"
	          }) {
	              _id
	              title
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
    expect(data).toMatchObject({
      data: {
        updateTask: {
          _id: `${createdTaskId}`,
          title: 'Updated',
        },
      },
    });
  });

  test('tasksByEvent', async () => {
    const response = await axios.post(URL, {
      query: `query {
                tasksByEvent (id: "${createdEventId}") {
					title
					description
                }
            }`,
    });
    const { data } = response;
    expect(Array.isArray(data.data.tasksByEvent)).toBeTruthy();
  });

  test('removeTask', async () => {
    const response = await axios.post(
      URL,
      {
        query: `
			  mutation {
				createTask(
					data: {
						title: "TaskRemove",
				}, eventId: "${createdEventId}") {
					_id
					title
					description
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

    const newTaskId = data.data.createTask._id;

    const deletedResponse = await axios.post(
      URL,
      {
        query: `
	            mutation {
	              removeTask(id: "${newTaskId}") {
	                    _id
	                    title
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
        removeTask: {
          _id: `${newTaskId}`,
          title: 'TaskRemove',
        },
      },
    });
  });

  test('removeEvent', async () => {
    // a new organization is created then deleted
    const response = await axios.post(
      URL,
      {
        query: `
          mutation {
            createEvent(
              data: {
                title: "Talawa Conference Test"
                description: "National conference that happens yearly"
                isPublic: true
                isRegisterable: true
                recurring: true
                recurrance: YEARLY
                location: "Test"
                startDate: "2/2/2020"
                allDay: true
                endTime: "2:00 PM"
                startTime: "1:00 PM"
                organizationId: "${createdOrgId}"
              }
            ) {
              _id
              title
              description
            }
          }`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const newEventId = response.data.data.createEvent._id;

    const deletedResponse = await axios.post(
      URL,
      {
        query: `
	            mutation {
	                removeEvent(id: "${newEventId}") {
	                    _id
	                    title
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
        removeEvent: {
          _id: `${newEventId}`,
          title: 'Talawa Conference Test',
        },
      },
    });
  });
});
