

const authCheck = (context)=> {
    console.log(context);
    if(context.expired) throw new Error("Access Token has expired. Please refresh session.")
    if (!context.isAuth) throw new Error("User is not authenticated");

}

module.exports = authCheck