const jwt = require("jsonwebtoken");

module.exports.createAccessToken = (user) => {
    const userId = user.id;
    return jwt.sign({
            tokenVersion: user.tokenVersion,
            userId: userId,
            firstName: user._doc.firstName,
            lastName: user._doc.lastName,
            email: user._doc.email
        },
        process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "15m"
        }
    );
}

module.exports.createRefreshToken = (user) => {
    const userId = user.id;
    return jwt.sign({
            tokenVersion: user.tokenVersion,
            userId: userId,
            firstName: user._doc.firstName,
            lastName: user._doc.lastName,
            email: user._doc.email
        },
        process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: "30d"
        }
    );
}