

const adminCheck = (context, org) =>{
  try{
    const isAdmin = org.admins.includes(context.userId);
    if (!isAdmin) {
      throw Apperror("User does not have required permissions");
    }
  }catch(e){
    throw Apperror("Server error" + e, 500);
  }
}

module.exports = adminCheck