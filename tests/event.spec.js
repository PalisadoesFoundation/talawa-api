const axios = require("axios");
const { URL } = require("../constants");
const getToken = require("./functions/getToken");
let token;
beforeAll(async () => {
	token = await getToken();
});

describe("event resolvers", () => {
	test("allEvents", async () => {
		const response = await axios.post(URL, {
			query: `query {
                events {
                    _id
                    title
                }
            }`,
		});
		const { data } = response;
		expect(Array.isArray(data.data.events)).toBeTruthy();
	});


	let createdEventId;
	let createdOrgId;
	test("createEvent", async () => {
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
          createEvent(
              data: {
                  title: "Talawa Conference Test",
                  description: "National conference that happens yearly",
                  isPublic: true,
                  isRegisterable: true,
                  recurring: true,
                  recurrance: "YEARLY",
                  location: "Test",
                  date: "2/2/2020",
                  organizationId: "${createdOrgId}",
          }) {
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
		createdEventId = data.data.createEvent._id;
		expect(data.data.createEvent).toEqual(
			expect.objectContaining({
				_id: expect.any(String),
				title: expect.any(String),
			})
		);
	});

	test("eventsByOrganization", async () => {
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
	});

	test("eventByID", async () => {
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

	test("registerForEvent", async () => {
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
				_id: expect.any(String),
				title: expect.any(String),
			})
		);
	});

	test("updateEvent", async () => {
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
					title: "Talawa Congress",
				},
			},
		});
	});

	test("removeEvent", async () => {
		//a new organization is created then deleted
		const response = await axios.post(
			URL,
			{
				query: `
	        mutation {
	          createEvent(
	              data: {
	                  title: "Test",
	                  description: "National conference that happens yearly",
	                  isPublic: true,
	                  isRegisterable: true,
	                  recurring: true,
	                  recurrance: "YEARLY",
	                  location: "Test",
	                  date: "2/2/2020",
	                  organizationId: "5ef5149792d1c1002474169b",
	          }) {
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
					title: "Test",
				},
			},
		});
	});

	//Event Projects

	test("allProjects", async () => {
		const response = await axios.post(URL, {
			query: `query {
	        projects {
	                    _id
	                    title
	                }
	            }`,
		});
		const { data } = response;
		expect(Array.isArray(data.data.projects)).toBeTruthy();
	});

	let createdProjectId;
	test("createEventProject", async () => {
		const response = await axios.post(
			URL,
			{
				query: `
	          mutation {
	            createEventProject(
	                data: {
	                    title: "Create demo sections",
	                    description: "Test",
	                    eventId: "${createdEventId}",
	            }) {
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
		createdProjectId = data.data.createEventProject._id;
		expect(data.data.createEventProject).toEqual(
			expect.objectContaining({
				_id: expect.any(String),
				title: expect.any(String),
				description: expect.any(String),
			})
		);
	});

	test("allProjectsByEvent", async () => {
		const response = await axios.post(URL, {
			query: `query {
	        projectsByEvent(id: "${createdEventId}") {
	                    _id
	                    title
	                }
	            }`,
		});
		const { data } = response;
		expect(Array.isArray(data.data.projectsByEvent)).toBeTruthy();
	});

	test("projectInfo", async () => {
		const response = await axios.post(URL, {
			query: `query {
	        project(id: "${createdProjectId}") {
	                    _id
	                    title
	                }
	            }`,
		});
		const { data } = response;
		expect(data.data.project).toBeTruthy();
	});

	test("updateEventProject", async () => {
		const response = await axios.post(
			URL,
			{
				query: `
	        mutation {
	          updateEventProject(id: "${createdProjectId}", data: {
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
				updateEventProject: {
					_id: `${createdProjectId}`,
					title: "Updated",
				},
			},
		});
	});

	let createdTaskId;
	test("createTask", async () => {
		const response = await axios.post(
			URL,
			{
				query: `
			  mutation {
				createTask(
					data: {
						title: "Task",
				}, projectId: "${createdProjectId}") {
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
					title: "Task",
				},
			},
		});
	});

	test("updateTask", async () => {
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
					title: "Updated",
				},
			},
		});
	});

	test("removeTask", async () => {
		const response = await axios.post(
			URL,
			{
				query: `
			  mutation {
				createTask(
					data: {
						title: "TaskRemove",
				}, projectId: "${createdProjectId}") {
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
					title: "TaskRemove",
				},
			},
		});
	});

	test("removeEventProject", async () => {
		const response = await axios.post(
			URL,
			{
				query: `
	          mutation {
	            createEventProject(
	                data: {
	                    title: "Test",
	                    description: "Test",
	                    eventId: "${createdEventId}",
	            }) {
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

		const newProjectId = response.data.data.createEventProject._id;

		const deletedResponse = await axios.post(
			URL,
			{
				query: `
	            mutation {
	              removeEventProject(id: "${newProjectId}") {
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
				removeEventProject: {
					_id: `${newProjectId}`,
					title: "Test",
				},
			},
		});
	});
});

module.exports.token = token;
