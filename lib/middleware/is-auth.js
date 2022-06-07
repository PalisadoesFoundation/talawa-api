const jwt = require('jsonwebtoken');
const logger = require('logger');

const isAuth = (req) => {// acepts requqest
  // This checks to see if there is an authorization field within the incoming request
  const authHeader = req.headers.authorization;

  // if there is no token
  if (!authHeader) {
    const isAuth = false;
    return {
      isAuth, // returns false auth and end the request
    };
  }
// THIS CODE RUN ONLY IF AUTHIS AVIALABLE 
  // format of request sent will be Bearer tokenvalue
  // this splits it into two values bearer and the token
  const token = authHeader.split(' ')[1];

  // if the token is null or an empty string
  if (!token || token === '') { 
    const isAuth = false;
    return {
      isAuth, // returns false auth and end the request
    };
  }
  // uses key created in the auth resolver
  // to be changed in production
  // only tokens created with this key will be valid tokens
  let decodedToken;
  let expired = false;
  try {
    decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET,
      (err, decoded) => {
        if (err) {
          return err;
        }
        return decoded; // returns the decoded JSON back 
      } // checking the token with JWT  verifiy
    ); // If there is an error decoded token would contain it
// IF TOKEN NOT VERIFIED THEN THE BELOW CODE EXECUTES
    if (decodedToken.name === 'TokenExpiredError') {
      // If the token has expired set the expired value to true and return it
      expired = true;
      const isAuth = false;
      return {
        isAuth, // FALSE AUTH (FAILED ) AND EXPIRED TRUE 
        expired,
      };
    }
  } catch (e) {
    const isAuth = false;
    return { 
      isAuth, // FALSE AUTH (FAILED ) AND EXPIRED TRUE FAILED IN VERIFICATION  PROCESS
      expired,
    };
  }

  // if the decoded token is not set 
  if (!decodedToken) {
    logger.info('decoded token is not present');
    const isAuth = false;
    return {
      isAuth,
    };
  }
// IF AFTER ALL TOEKEN IS VALID THE USER ID IS TAKEN OUT FROM TOKEN 
  // shows the user is an authenticated user
  const isAuth = true;
  // pulls data off the token
  const { userId } = decodedToken;

  return {
    isAuth,
    userId,
  };
};

module.exports = isAuth;
