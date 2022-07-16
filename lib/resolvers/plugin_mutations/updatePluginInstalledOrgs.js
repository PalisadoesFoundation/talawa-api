const Plugin = require('../../models/Plugin');
// eslint-disable-next-line no-unused-vars
module.exports = async (parent, args, context) => {
  let plug = await Plugin.findById(args.id);
  const plugOrgList = plug.installedOrgs;
  const isDuplicate = plugOrgList.includes(args.orgId);

  if (isDuplicate) {
    // eslint-disable-next-line no-unused-vars
    const result = await Plugin.findByIdAndUpdate(
      args.id,
      { $pull: { installedOrgs: args.orgId } },
      { new: true },
      (err, res) => {
        if (err) {
          console.log(err);
        } else {
          console.log('Updated Plugin with installed orgs  : ', res);
        }
      }
    );
  } else {
    // eslint-disable-next-line no-unused-vars
    const result = await Plugin.findByIdAndUpdate(
      args.id,
      { $push: { installedOrgs: args.orgId } },
      { new: true },
      (err, res) => {
        if (err) {
          console.log(err);
        } else {
          console.log('Updated Plugin with installed orgs  : ', res);
        }
      }
    );
  }

  plug = await Plugin.findById(args.id);
  return plug;
};
