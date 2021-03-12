const adminCheck = (context, org) => {
  const isAdmin = org.admins.includes(context.userId);
  if (!isAdmin) {
    throw new Error('User does not have required permissions');
  }
};

module.exports = adminCheck;
