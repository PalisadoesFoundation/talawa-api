const Plugin = require('../../models/Plugin');

module.exports = async (parent, args, context) => {
    console.log("Argment s ", args)
    const result = await Plugin.findByIdAndUpdate(args.id, { pluginInstallStatus: args.status }, { new: true },
        (err, res) => {
            if (err) {
                console.log(err)
            }
            else {
                console.log("Updated Plugin : ", res);
            };
        });
    const plug = await Plugin.findById(args.id)
    return plug;
}
