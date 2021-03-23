

const creatorCheck = (context,org) => {
  try{
    const isCreator = org.creator == context.userId
    if (!isCreator) {
      throw Apperror("Users cannot delete organizations they didn't create");
    }
  }catch(e){
    throw Apperror("Server error" + e, 500);
  }
}

module.exports = creatorCheck