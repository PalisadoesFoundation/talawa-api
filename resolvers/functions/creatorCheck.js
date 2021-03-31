const creatorCheck = (context, org) => {
  const isCreator = org.creator + '' === context.userId;  //Casted org.creator to string to have matching types with === operator
  if (!isCreator) {
    throw new Error("Users cannot delete organizations they didn't create");
  }
};

module.exports = creatorCheck;
