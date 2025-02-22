import { expect, suite, test } from "vitest";
import { faker } from "@faker-js/faker";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { Query_organization } from "../documentNodes";

suite("Query field organizations", () => {
  suite("Input Validation", () => {
    test("returns an error if input validation fails", async () => {
      const result = await mercuriusClient.query(Query_organization, {
        variables: {
          input: {
            id: "invalid-id", // Assuming ID should be a number
          },
        },
      });

      expect(result.data.organizations).toBeNull();
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            extensions: expect.objectContaining({
              code: "invalid_arguments",
            }),
          }),
        ]),
      );
    });
  });

  suite("Fetching Specific Organization", () => {
    test("returns the organization if a valid ID is provided", async () => {
      const organizationId = 1; // Use a known ID for testing
      const result = await mercuriusClient.query(Query_organizations, {
        variables: {
          input: { id: organizationId },
        },
      });

      expect(result.errors).toBeUndefined();
      expect(result.data.organizations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: organizationId.toString(),
          }),
        ]),
      );
    });

    test("returns null if organization is not found", async () => {
      const result = await mercuriusClient.query(Query_organizations, {
        variables: {
          input: { id: 999999 }, // Assuming this ID does not exist
        },
      });

      expect(result.data.organizations).toEqual([]);
    });
  });

  suite("Fetching All Organizations", () => {
    test("returns all organizations when no ID is provided", async () => {
      const result = await mercuriusClient.query(Query_organizations);

      expect(result.errors).toBeUndefined();
      expect(result.data.organizations).toBeInstanceOf(Array);
      expect(result.data.organizations.length).toBeGreaterThan(0);
    });
  });
});
