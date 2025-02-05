import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key'; // Ensure this is set in your environment variables

export const verifyClient = (info, next) => {
  const token = info.req.headers['sec-websocket-protocol'];

  if (!token) {
    return next(false, 401, 'Unauthorized');
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return next(false, 401, 'Unauthorized');
    }

    info.req.user = decoded;
    next(true);
  });
};

export const onConnect = (data) => {
  const token = data.authToken;

  if (!token) {
    throw new Error('Missing auth token!');
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return { user: decoded };
  } catch (err) {
    throw new Error('Invalid auth token!');
  }
};
