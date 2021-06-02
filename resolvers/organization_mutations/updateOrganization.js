const updateOrganization = async (parent, args, context) => {
  const { org } = context;

  //UPDATE ORGANIZATION
  org.overwrite({
    ...org._doc,
    ...args.data,
  });
  await org.save();

  return org;
};

module.exports = updateOrganization;
