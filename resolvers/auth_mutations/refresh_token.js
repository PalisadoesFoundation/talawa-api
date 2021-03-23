
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const {createAccessToken, createRefreshToken} = require("../../helper_functions/auth");


module.exports = async(parent, args, context,info) =>{
    // This route should not be protected because the access token will be expired
    try{
    const refreshToken = args.refreshToken;
    if(!refreshToken) {
        throw Apperror("Invalid refresh Token");
    }

    let payload = null;

    try {
        payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    }catch(err){
        throw err;
    }

    // The refresh token received is valid so we cna send a new access token
    const user = await User.findOne({ _id: payload.userId });
    if (!user) {
      throw Apperror("Invalid Credentials");
    }

    if(user.tokenVersion !== payload.tokenVersion) {
        throw Apperror("Invalid refresh Token");
    }


    // send new access and refresh token to user
    const newAccessToken = await createAccessToken(user);
    const newRefreshToken = await createRefreshToken(user);

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
    }
    }catch(e){
        throw Apperror("Server error" + e, 500);
    }

}