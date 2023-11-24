import { ldapConfig } from "../config/ldapConfig";
import client from "./ldap";
import type { NextFunction, Request, Response } from "express";
import type { SearchOptions } from "ldapts";
import { errors } from "../libraries";
import {
  INVALID_CREDENTIALS_ERROR,
  EMAIL_ALREADY_EXISTS_ERROR,
} from "../constants";
import jwt from "jsonwebtoken";

export const generateToken = (email: string): string => {
  return jwt.sign({ email }, `${process.env.jwtSecret}`, {
    expiresIn: `${process.env.expiresIn}`,
  });
};

const ldapLogin = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const { email, password } = request.body;
  const userDN = `uid=${email},${ldapConfig.userBaseDN}`;
  const SearchOptions: SearchOptions = {
    filter: `uid=${email}`,
    scope: "sub",
    attributes: ["cn", "sn", "uid"],
  };
  try {
    const { searchEntries } = await client.search(
      ldapConfig.userBaseDN,
      SearchOptions
    );
    await client.bind(userDN, password);
    const token = generateToken(email);
    // eslint-disable-next-line
    response.json({ searchEntries, token });
  } catch (error) {
    return next(
      new errors.ValidationError(
        [
          {
            message: INVALID_CREDENTIALS_ERROR.MESSAGE,
            code: INVALID_CREDENTIALS_ERROR.CODE,
            param: INVALID_CREDENTIALS_ERROR.PARAM,
          },
        ],
        INVALID_CREDENTIALS_ERROR.MESSAGE
      )
    );
  }
};

const ldapRegister = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const { firstName, lastName, email, password } = request.body;
  const userDN = `uid=${email},${ldapConfig.userBaseDN}`;
  const userData = {
    firstName,
    lastName,
    email,
  };
  try {
    const entry = {
      cn: [firstName],
      sn: [lastName],
      uid: [email],
      userPassword: [password],
      objectClass: ["top", "person", "organizationalPerson", "inetOrgPerson"],
    };
    await client.add(userDN, entry);
    const token = generateToken(email);
    // eslint-disable-next-line
    response.json({ userData, token });
  } catch (error) {
    return next(
      new errors.ConflictError(
        EMAIL_ALREADY_EXISTS_ERROR.MESSAGE,
        EMAIL_ALREADY_EXISTS_ERROR.CODE,
        EMAIL_ALREADY_EXISTS_ERROR.PARAM
      )
    );
  }
};

export { ldapLogin, ldapRegister };
