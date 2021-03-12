

const creatorCheck = (context,org) => {
  try{
    const isCreator = org.creator == context.userId
    if (!isCreator) {
      throw new Error("Users cannot delete organizations they didn't create");
    }
  }catch(e){
    throw e;
  }
}

module.exports = creatorCheck