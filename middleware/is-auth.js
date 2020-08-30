const jwt = require("jsonwebtoken");

const isAuth = (req) => {
  //This checks to see if there is an authorization field within the incoming request
  const authHeader = req.headers.authorization;

  //if there is no token
  if (!authHeader) {
    const isAuth = false;
    return {
      isAuth,
    };
  }

  //format of request sent will be Bearer tokenvalue
  //this splits it into two values bearer and the token
  const token = authHeader.split(" ")[1];

  //if the token is null or an empty string
  if (!token || token === "") {
    const isAuth = false;
    return {
      isAuth,
    };
  }
  //console.log(token);

  //uses key created in the auth resolver
  //to be changed in production
  //only tokens created with this key will be valid tokens
  let decodedToken;
  let expired = false;
  try {
    decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
      if (err) {
          return err;
      } else{
        //console.log("decoded")
          return decoded;
      }
    }); // If there is an error decoded token would contain it

    if(decodedToken.name=='TokenExpiredError') { // If the token has expired set the expired value to true and return it
      expired = true;
      const isAuth = false;
      return {
        isAuth,
        expired
      }
    }
  } catch (e) {
    const isAuth = false;
    return {
      isAuth,
      expired
    };
  }

  //if the decoded token is not set
  if (!decodedToken) {
    console.log("decoded token is not present")
    const isAuth = false;
    return {
      isAuth,
    };
  }

  //shows the user is an authenticated user
  const isAuth = true;
  //pulls data off the token
  const userId = decodedToken.userId;

  return {
    isAuth,
    userId,
  };
};

module.exports = isAuth;
