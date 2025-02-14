import { createTestClient } from 'apollo-server-testing';
import { ApolloServer } from 'apollo-server';
import { schema } from '~/src/graphql/schema';
import { context } from '~/src/graphql/context'; // Ensure 'context' is correctly exported from this module

describe('userList', () => {
    let query: any;

    beforeAll(() => {
        const server = new ApolloServer({ schema, context });
        query = createTestClient(server).query;
    });

    it('should return a list of users', async () => {
        const res = await query({
            query: `
                query {
                    userList(first: 5, skip: 0) {
                        id
                        username
                    }
                }
            `
        });

        expect(res.errors).toBeUndefined();
        expect(res.data.userList).toHaveLength(5);
    });

    it('should return an error if arguments are invalid', async () => {
        const res = await query({
            query: `
                query {
                    userList(first: -1, skip: 0) {
                        id
                        username
                    }
                }
            `
        });

        expect(res.errors).toBeDefined();
        expect(res.errors[0].extensions.code).toBe('invalid_arguments');
    });
});
