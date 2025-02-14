import { createTestClient } from 'apollo-server-testing';
import { ApolloServer } from 'apollo-server';
import { schema } from '~/src/graphql/schema';
import { context } from '~/src/graphql/context'; // Ensure 'context' is correctly exported from this module

describe('organizationConnectionList', () => {
    let query: any;

    beforeAll(() => {
        const server = new ApolloServer({ schema, context });
        query = createTestClient(server).query;
    });

    it('should return a list of organizations', async () => {
        const res = await query({
            query: `
                query {
                    organizationConnectionList(first: 5, skip: 0) {
                        id
                        name
                    }
                }
            `
        });

        expect(res.errors).toBeUndefined();
        expect(res.data.organizationConnectionList).toHaveLength(5);
    });

    it('should return an error if arguments are invalid', async () => {
        const res = await query({
            query: `
                query {
                    organizationConnectionList(first: -1, skip: 0) {
                        id
                        name
                    }
                }
            `
        });

        expect(res.errors).toBeDefined();
        expect(res.errors[0].extensions.code).toBe('invalid_arguments');
    });
});
