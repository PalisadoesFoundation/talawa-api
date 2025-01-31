import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import jwt from "jsonwebtoken";
import type { InterfaceAppUserProfile } from "../../models/AppUserProfile";
import { AppUserProfile } from "../../models/AppUserProfile";
import type { Request } from "express";
import type { InterfaceJwtTokenPayload } from "../../utilities";
/**
 * This query verifies the user's role based on the provided JWT token.
 * @param _ - Unused parent parameter (as this is a root-level query).
 * @param __ - Unused arguments parameter (as this query does not require input arguments).
 * @param context - Contains the Express `Request` object, which includes the Authorization header.
 * @returns An object containing:
 *   - `role`: The user's role, either "admin" or "user".
 *   - `isAuthorized`: A boolean indicating whether the token is valid.
 *
 * @remarks
 * - Extracts the token from the `Authorization` header.
 * - Decodes and verifies the token using `jwt.verify()`.
 * - Fetches the user profile from the database using `userId` from the decoded token.
 * - Determines the role (`admin` if `isSuperAdmin` is `true`, otherwise `user`).
 * - Returns the role and authorization status.
 */

export const verifyRole: QueryResolvers["verifyRole"] = async (
  _: unknown,
  args: unknown,
  { req }: { req: Request },
) => {
  try {
    // Extract token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return { role: "", isAuthorized: false };
    }
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;
    if (!token) {
      return { role: "", isAuthorized: false };
    }
    // Verify token
    if (!process.env.ACCESS_TOKEN_SECRET) {
      throw new Error("ACCESS_TOKEN_SECRET is not defined");
    }
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string,
    );
    const decodedToken = decoded as InterfaceJwtTokenPayload;
    if (!decodedToken.userId) {
      throw new Error("Invalid token: userId is missing");
    }
    const appUserProfile: InterfaceAppUserProfile | null =
      await AppUserProfile.findOne({
        userId: decodedToken.userId,
        appLanguageCode: process.env.DEFAULT_LANGUAGE_CODE || "en",
        tokenVersion: process.env.TOKEN_VERSION
          ? parseInt(process.env.TOKEN_VERSION)
          : 0,
      });
    if (appUserProfile == null || appUserProfile == undefined) {
      throw new Error("User profile not found");
    }

    let role = "user"; // Default role
    if (appUserProfile) {
      if (appUserProfile.isSuperAdmin) {
        role = "superAdmin";
      } else if (
        appUserProfile.adminFor &&
        appUserProfile.adminFor.length > 0
      ) {
        role = "admin";
      }
    }
    return {
      role: role,
      isAuthorized: true,
    };
  } catch (error) {
    // Log sanitized error for debugging
    console.error(
      "Token verification failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    // Return specific error status
    const isJwtError = error instanceof jwt.JsonWebTokenError;
    return {
      role: "",
      isAuthorized: false,
      error: isJwtError ? "Invalid token" : "Authentication failed",
    };
  }
};
