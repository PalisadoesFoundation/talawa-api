# About this directory

This directory contains the code for performing api tests against talawa api. The tests in this directory must follow the practices of black box testing and most of them should be written to be able to run concurrently.

# Testing philosophy

Black box testing in this context means we test talawa api from the perspective of a client making requests to it. This also means that we must only communicate with talawa api during the tests with its publically exposed interface. 

In the context of the rest api interfaces exposed by talawa api it means making standard HTTP calls using methods like GET, POST, PATCH, PUT, DELETE etc., and asserting against the HTTP responses. 

In the context of the graphql api interfaces exposed by talawa api it means triggering standard graphql query, mutation and subscription operations against the graphql api endpoint(over HTTP POST method for our use case) and asserting against the graphql responses.

# Directory structure

The `./server.ts` file exports the talawa api server instance that can be imported and used in different api tests. This talawa api server instance is shared between api tests.

There aren't any other strict structure requirements for the this directory.

# Future considerations

In the future there might be a requirement to run some tests sequentially. When that moment arrives seperating sequential and parallel tests into seperate directories and using seperate vitest configuration for them would be the best idea.

# Writing non-flaky concurrent tests

Here are the guidelines for writing non-flaky tests that are able to run concurrently/parallely:

1. All tests must set up their own data to get the application to their desired state. Tests must not assume that the data they need to act on can be dervied from other tests or could pre-exist.

2. All tests must perform write operations only on data associated to them. Tests must not in any way perform write operations on data that isn't associated to them because it could lead to disruption of other tests. The best way to ensure this is to introduce uniqueness to the data created within tests through the usage of cryptographic identifier generators like uuid, cuid, nanoid etc.

3. All tests must either assert against data associated to them or they must change their assertion logic to something that suits asserting against random data.

Example test suites 1 and 2 depicting the violations and followage of these guidelines:

```typescript
// Test suite 1
suite.concurrent("flaky concurrent tests", async () => {
	test.concurrent("create user test", async () => {
		const userData = {
			id: "1",
			name: "user1",
		};
		const createdUsers = await fetch.post("/users", {
			body: [userData],
		});
		expect(createdUsers[0]).toEqual(userData);
	});

	test.concurrent("get user test", async () => {
		const user = await fetch.get("/users/1");
		expect(user).toEqual({
			id: "1",
			name: "user1",
		});
	});

	test.concurrent("update user test", async () => {
		const updatedUser = await fetch.update("/user/1", {
			body: {
				name: "updatedUser1",
			},
		});
		expect(updatedUser).toEqual({
			id: "1",
			name: "updatedUser1",
		});
	});

	test.concurrent("delete user test", async () => {
		const deletedUser = await fetch.delete("/user/1");
		expect(deletedUser).toEqual({
			id: "1",
			name: "user1",
		});
	});

	test.concurrent("get users test", async () => {
		await fetch.post("/users", {
			body: [
				{
					id: "2",
					name: "user2",
				},
				{
					id: "3",
					name: "user3",
				},
				{
					id: "4",
					name: "user4",
				},
			],
		});
		const users = await fetch.get("/users");
		expect(users).toHaveLength(3);
	});
});
```
```typescript
// Test suite 2
suite.concurrent("non-flaky concurrent tests", async () => {
	test.concurrent("create user test", async () => {
		const userData = {
			id: randomIdGenerator(),
			name: `name${randomIdGenerator()}`
		}
		const createdUsers = await fetch.post("/users", {
			body: [
				userData,
			],
		});
		expect(createdUsers[0]).toEqual(userData);
	});

	test.concurrent("get user test", async () => {
		const userData = {
			id: randomIdGenerator(),
			name: `name${randomIdGenerator()}`
		}
		await fetch.post("/users", {
			body: [
				userData,
			],
		});
		const user = await fetch.get(`/users/${userData.id}`);
		expect(user).toEqual(userData);
	});

	test.concurrent("update user test", async () => {
		const userData = {
			id: randomIdGenerator(),
			name: `name${randomIdGenerator()}`
		}
		await fetch.post("/users", {
			body: [
				userData,
			],
		});
		const newName = `newName${randomIdGenerator()}`;
		const updatedUser = await fetch.update(`/users/${userData.id}`, {
			body: {
				name: newName,
			},
		});
		expect(updatedUser).toEqual({
			id: userData.id,
			name: newName,
		});
	});

	test.concurrent("delete user test", async () => {
		const userData = {
			id: randomIdGenerator(),
			name: `name${randomIdGenerator()}`
		}
		await fetch.post("/users", {
			body: [
				userData,
			],
		});
		const deletedUser = await fetch.delete(`/users/${userData.id}`);
		expect(deletedUser).toEqual(userData);
	});

	test.concurrent("get users test", async () => {
		const userDataList = [
			{
				id: randomIdGenerator(),
				name: `name${randomIdGenerator()}`
			},
			{
				id: randomIdGenerator(),
				name: `name${randomIdGenerator()}`
			},			{
				id: randomIdGenerator(),
				name: `name${randomIdGenerator()}`
			},	
		]
		await fetch.post("/users", {
			body: userDataList,
		});
		const users = await fetch.get("/users");
		expect(users).length.greaterThanOrEqual(3);
	});
});
```