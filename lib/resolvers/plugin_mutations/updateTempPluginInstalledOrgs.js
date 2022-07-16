const PluginTemp = require('../../models/temp/Plugin');
module.exports = async (parent, args, context) => {

    let plug = await PluginTemp.findById(args.id)
    const plugOrgList = plug.installedOrgs;
    const isDuplicate = plugOrgList.includes(args.orgId)

    if (isDuplicate) {
        const result = await PluginTemp.findByIdAndUpdate(
            args.id,
            { $pull: { installedOrgs: args.orgId } },
            { new: true },
            (err, res) => {
                if (err) {
                    console.log(err)
                }
                else {
                    console.log("Updated Plugin with installed orgs  : ", res);
                };
            }
        );
    } else {
        const result = await PluginTemp.findByIdAndUpdate(
            args.id,
            { $push: { installedOrgs: args.orgId } },
            { new: true },
            (err, res) => {
                if (err) {
                    console.log(err)
                }
                else {
                    console.log("Updated Plugin with installed orgs  : ", res);
                };
            }
        );
    }

    plug = await PluginTemp.findById(args.id)
    return plug;
}
