import { expect, test } from "vitest";
import { integrationHeavy } from "../../src/integration_heavy";

test("integrationHeavy works", () => {
	expect(integrationHeavy(0)).toBe(49);
});
