import { expect, suite, test } from "vitest";
import { mercuriusClient } from "../client";
import { helloQueryDoc } from "../documentNodes";

suite.concurrent("Query.hello", async () => {
	test("returns the expected data", async () => {
		const result = await mercuriusClient.query(helloQueryDoc, {
			variables: {
				name: "user",
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data.hello).toEqual("user");
	});
});
