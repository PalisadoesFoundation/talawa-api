import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildServer } from "test/server";
import { mercuriusClient } from "test/utils/mercuriusClient";
import { faker } from "@faker-js/faker";

describe("updateVenue mutation (integration)", () => {
  let app: Awaited<ReturnType<typeof buildServer>>;
  let client: ReturnType<typeof mercuriusClient>;
  let venueId: string;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();

    client = mercuriusClient(app);

    // Seed a venue (copy pattern from createVenue.test.ts)
    const createRes = await client.mutate({
      mutation: `
        mutation CreateVenue($input: MutationCreateVenueInput!) {
          createVenue(input: $input) {
            id
          }
        }
      `,
      variables: {
        input: {
          name: faker.company.name(),
          description: "Initial description",
          capacity: 50,
        },
      },
    });

    venueId = createRes.data.createVenue.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects unauthenticated user", async () => {
    const res = await client.mutate({
      mutation: `
        mutation UpdateVenue($input: MutationUpdateVenueInput!) {
          updateVenue(input: $input) {
            id
          }
        }
      `,
      variables: {
        input: {
          id: venueId,
          name: "New Name",
        },
      },
      auth: false,
    });

    expect(res.errors?.length).toBeGreaterThan(0);
  });

  it("rejects invalid venue id format", async () => {
    const res = await client.mutate({
      mutation: `
        mutation UpdateVenue($input: MutationUpdateVenueInput!) {
          updateVenue(input: $input) {
            id
          }
        }
      `,
      variables: {
        input: {
          id: "not-a-uuid",
          name: "Invalid",
        },
      },
    });

    expect(res.errors?.some(e => e.message.includes("UUID"))).toBe(true);
  });

  it("updates venue name only", async () => {
    const res = await client.mutate({
      mutation: `
        mutation UpdateVenue($input: MutationUpdateVenueInput!) {
          updateVenue(input: $input) {
            id
            name
            description
            capacity
          }
        }
      `,
      variables: {
        input: {
          id: venueId,
          name: "Updated Venue Name",
        },
      },
    });

    expect(res.errors).toBeUndefined();
    expect(res.data.updateVenue.name).toBe("Updated Venue Name");
  });

  it("updates capacity only", async () => {
    const res = await client.mutate({
      mutation: `
        mutation UpdateVenue($input: MutationUpdateVenueInput!) {
          updateVenue(input: $input) {
            capacity
          }
        }
      `,
      variables: {
        input: {
          id: venueId,
          capacity: 200,
        },
      },
    });

    expect(res.data.updateVenue.capacity).toBe(200);
  });

  it("rejects when no optional fields are provided", async () => {
    const res = await client.mutate({
      mutation: `
        mutation UpdateVenue($input: MutationUpdateVenueInput!) {
          updateVenue(input: $input) {
            id
          }
        }
      `,
      variables: {
        input: {
          id: venueId,
        },
      },
    });

    expect(res.errors?.length).toBeGreaterThan(0);
  });
});
