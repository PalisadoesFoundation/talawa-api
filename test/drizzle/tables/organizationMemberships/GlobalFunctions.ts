import { mercuriusClient } from "test/graphql/types/client";
import {
  Mutation_createOrganization,
  Query_signIn,
} from "test/graphql/types/documentNodes";
import { assertToBeNonNullish } from "test/helpers";
import { server } from "test/server";
import { expect } from "vitest";

export async function createTestOrganization(): Promise<string> {
  const signIn = await mercuriusClient.query(Query_signIn, {
    variables: {
      input: {
        emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
        password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
      },
    },
  });

  expect(signIn.errors ?? []).toEqual([]);

  const token = signIn.data?.signIn?.authenticationToken;
  expect(token).toBeDefined();

  const org = await mercuriusClient.mutate(Mutation_createOrganization, {
    headers: { authorization: `bearer ${token}` },
    variables: {
      input: {
        name: `Org-${Date.now()}`,
        countryCode: "us",
        isUserRegistrationRequired: true,
      },
    },
  });

  expect(org.errors ?? []).toEqual([]);

  const orgId = org.data?.createOrganization?.id;
  expect(orgId).toBeDefined();

  return orgId as string;
}

export async function loginAdminUser(): Promise<{
  adminId: string;
  authToken: string;
}> {
  const adminSignInResult = await mercuriusClient.query(Query_signIn, {
    variables: {
      input: {
        emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
        password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
      },
    },
  });

  // Check for errors first
  if (adminSignInResult.errors) {
    throw new Error(
      `Admin sign-in failed: ${JSON.stringify(adminSignInResult.errors)}`
    );
  }

  assertToBeNonNullish(adminSignInResult.data?.signIn);
  assertToBeNonNullish(adminSignInResult.data.signIn.authenticationToken);
  assertToBeNonNullish(adminSignInResult.data.signIn.user);

  return {
    adminId: adminSignInResult.data.signIn.user.id,
    authToken: adminSignInResult.data.signIn.authenticationToken,
  };
}
