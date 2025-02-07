import type { IncomingMessage } from "node:http";

// No JWT verification is performed here for simplicity.
// In production, replace these simplified checks with proper JWT verification.
interface WebSocketInfo {
  req: IncomingMessage;
}

export const verifyClient = (
  info: WebSocketInfo,
  next: (verified: boolean, code?: number, message?: string) => void
) => {
  const token = info.req.headers["sec-websocket-protocol"];
  if (!token) {
    return next(false, 401, "Unauthorized: No token provided");
  }
  // For simplicity, if a token exists, we accept the connection.
  next(true);
};

interface ConnectData {
  authToken: string;
}

export const onConnect = (data: ConnectData) => {
  const token = data.authToken;
  if (!token || token.trim() === "") {
    throw new Error("Missing auth token");
  }
  // For simplicity, do not verify the token. Just return a dummy user.
  return { user: { id: "dummy", name: "Temporary User" } };
};
