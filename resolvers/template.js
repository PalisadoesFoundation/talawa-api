
const authCheck = require("../functions/authCheck");


module.exports = async(parent,args,context,info) => {
    try{
        authCheck(context);
    } catch(e) {
        throw e
    }
}