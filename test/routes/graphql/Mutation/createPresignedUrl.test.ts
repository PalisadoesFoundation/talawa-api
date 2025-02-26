import { expect, suite, test } from "vitest";
import { faker } from "@faker-js/faker";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
  Query_signIn,
  Mutation_createPresignedUrl,
  Mutation_createOrganization,
} from "../documentNodes";

suite("Mutation field createPresignedUrl", () => {
  suite("when the client is not authenticated", () => {
    test("should return an error with unauthenticated extensions code", async () => {
      // We supply a dummy organizationId since the authentication check happens first.
      const result = await mercuriusClient.mutate(Mutation_createPresignedUrl, {
        variables: {
          input: {
            fileName: "testfile.txt",
            fileType: "text/plain",
            organizationId: faker.string.uuid(),
          },
        },
      });
      expect(result.data?.createPresignedUrl).toBeNull();
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            extensions: expect.objectContaining({ code: "unauthenticated" }),
            path: ["createPresignedUrl"],
          }),
        ])
      );
    });
  });

  suite("when the presigned URL is generated successfully", () => {
    test("should return a presignedUrl and fileUrl", async () => {
      // Override the minio client's presignedPutObject to simulate success.
      const originalPresignedPutObject = server.minio.client.presignedPutObject;
      server.minio.client.presignedPutObject = async (
        bucket: string,
        objectName: string,
        expiry: number
      ): Promise<string> => {
        return "https://example.com/presigned-url";
      };

      // Sign in as an authenticated user.
      const signInResult = await mercuriusClient.query(Query_signIn, {
        variables: {
          input: {
            emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
            password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
          },
        },
      });
      assertToBeNonNullish(signInResult.data.signIn?.authenticationToken);
      const authToken = signInResult.data.signIn.authenticationToken;

      // Create an organization so that the organizationId is valid.
      const createOrgResult = await mercuriusClient.mutate(
        Mutation_createOrganization,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              name: "presigned-url-org",
              description: "Organization for presigned URL test",
              countryCode: "us",
              state: "test",
              city: "test",
              postalCode: "12345",
              addressLine1: "Address 1",
              addressLine2: "Address 2",
            },
          },
        }
      );
      const orgId = createOrgResult.data?.createOrganization?.id;
      assertToBeNonNullish(orgId);

      const result = await mercuriusClient.mutate(Mutation_createPresignedUrl, {
        headers: { authorization: `bearer ${authToken}` },
        variables: {
          input: {
            fileName: "testfile.txt",
            fileType: "text/plain",
            organizationId: orgId,
          },
        },
      });

      expect(result.data?.createPresignedUrl).toEqual(
        expect.objectContaining({
          presignedUrl: "https://example.com/presigned-url",
          fileUrl: expect.stringContaining(
            `http://${server.minio.config.endPoint}:${server.minio.config.port}/${server.minio.bucketName}/uploads/`
          ),
        })
      );

      // Restore the original presignedPutObject.
      server.minio.client.presignedPutObject = originalPresignedPutObject;
    });
  });

  suite("when presignedPutObject fails", () => {
    test("should return an error with unexpected extensions code", async () => {
      // Override the minio client's presignedPutObject to simulate a failure.
      const originalPresignedPutObject = server.minio.client.presignedPutObject;
      server.minio.client.presignedPutObject = async (): Promise<string> => {
        throw new Error("Simulated failure");
      };

      // Sign in as an authenticated user.
      const signInResult = await mercuriusClient.query(Query_signIn, {
        variables: {
          input: {
            emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
            password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
          },
        },
      });
      assertToBeNonNullish(signInResult.data.signIn?.authenticationToken);
      const authToken = signInResult.data.signIn.authenticationToken;

      // Create an organization so that the organizationId is valid.
      const createOrgResult = await mercuriusClient.mutate(
        Mutation_createOrganization,
        {
          headers: { authorization: `bearer ${authToken}` },
          variables: {
            input: {
              name: "presigned-url-org-failure",
              description: "Organization for presigned URL failure test",
              countryCode: "us",
              state: "test",
              city: "test",
              postalCode: "12345",
              addressLine1: "Address 1",
              addressLine2: "Address 2",
            },
          },
        }
      );
      const orgId = createOrgResult.data?.createOrganization?.id;
      assertToBeNonNullish(orgId);

      const result = await mercuriusClient.mutate(Mutation_createPresignedUrl, {
        headers: { authorization: `bearer ${authToken}` },
        variables: {
          input: {
            fileName: "testfile.txt",
            fileType: "text/plain",
            organizationId: orgId,
          },
        },
      });

      expect(result.data?.createPresignedUrl).toBeNull();
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            extensions: expect.objectContaining({
              code: "unexpected",
              message: expect.stringContaining("Error generating presigned URL: Simulated failure"),
            }),
            path: ["createPresignedUrl"],
          }),
        ])
      );

      // Restore the original presignedPutObject.
      server.minio.client.presignedPutObject = originalPresignedPutObject;
    });
  });
});
