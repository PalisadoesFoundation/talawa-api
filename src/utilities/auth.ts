import type { IncomingMessage } from "node:http";
import jwt from "jsonwebtoken";

// Retrieve the secret key from the environment variable
const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error("SECRET_KEY environment variable is not set.");
}

declare module "node:http" {
  interface IncomingMessage {
    user?: object;
  }
}

interface WebSocketInfo {
  req: IncomingMessage;
}

export const verifyClient = (
  info: WebSocketInfo,
  next: (verified: boolean, code?: number, message?: string) => void
) => {
  const token = info.req.headers["sec-websocket-protocol"];

  if (!token) {
    return next(false, 401, "Unauthorized");
  }

  jwt.verify(token, SECRET_KEY, (err: jwt.VerifyErrors | null, decoded: jwt.JwtPayload | string | undefined) => {
    if (err) {
      return next(false, 401, "Unauthorized");
    }

    if (typeof decoded === "object") {
      info.req.user = decoded;
    } else {
      return next(false, 401, "Unauthorized");
    }
    next(true);
  });
};

interface ConnectData {
  authToken: string;
}

export const onConnect = (data: ConnectData) => {
  const token = data.authToken;

  if (!token) {
    throw new Error("Missing auth token!");
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return { user: decoded };
  } catch (err) {
    throw new Error("Invalid auth token!");
  }
};
