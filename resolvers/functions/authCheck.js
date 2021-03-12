

const authCheck = (context)=> {
    try{
    if(context.expired) throw new Error("Access Token has expired. Please refresh session.")
    if (!context.isAuth) throw new Error("User is not authenticated");
    }catch(e){
        throw e;
    }
}

module.exports = authCheck