
const AppError = require("../error_middleware/error_handler");
const authCheck = require("./functions/authCheck");


module.exports = async(parent,args,context,info) => {
    try{
        authCheck(context);
    } catch(e) {
        throw AppError("Server Error" + e , 500);
    }
}