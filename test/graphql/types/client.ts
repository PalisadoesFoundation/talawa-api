import { createMercuriusTestClient } from "mercurius-integration-testing";
import { server } from "../../server";

/**
 * Graphql client for triggering graphql operations against talawa api's graphql implementation during tests.
 */
export const mercuriusClient = createMercuriusTestClient(server, {
	url: "/graphql",
});
