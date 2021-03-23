

const authCheck = (context)=> {
    try{
    if(context.expired) throw Apperror("Access Token has expired. Please refresh session.")
    if (!context.isAuth) throw Apperror("User is not authenticated");
    }catch(e){
        throw Apperror("Server error" + e, 500);
    }
}

module.exports = authCheck