const User = require("../../models/User");


module.exports = async (parent, args, context, info) => {
    try{
        await User.findOneAndUpdate(
            {_id: args.userId},
            {
                $inc: {
                    'tokenVersion':1
                }
            },
            {
                new: true
            }
        )
        return true;
    }catch(e){
        throw e;
    }
}