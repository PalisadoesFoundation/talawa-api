const Plugin = require('../../models/Plugin');

// eslint-disable-next-line no-unused-vars
module.exports = async (parent, args, context) => {
  console.log('Argment s ', args);
  // eslint-disable-next-line no-unused-vars
  const result = await Plugin.findByIdAndUpdate(
    args.id,
    { pluginInstallStatus: args.status },
    { new: true },
    (err, res) => {
      if (err) {
        console.log(err);
      } else {
        console.log('Updated Plugin : ', res);
      }
    }
  );
  const plug = await Plugin.findById(args.id);
  return plug;
};
