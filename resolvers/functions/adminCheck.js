

const adminCheck = (context, org) =>{
  try{
    const isAdmin = org.admins.includes(context.userId);
    if (!isAdmin) {
      throw new Error("User does not have required permissions");
    }
  }catch(e){
    throw e;
  }
}

module.exports = adminCheck