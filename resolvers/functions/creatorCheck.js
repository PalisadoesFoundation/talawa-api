const creatorCheck = (context, org) => {
  const isCreator = String(org.creator) === context.userId;
  if (!isCreator) {
    throw new Error("Users cannot delete organizations they didn't create");
  }
};

module.exports = creatorCheck;
