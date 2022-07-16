const Plugin = require('../../models/Plugin');
module.exports = async (parent, args, context) => {

    let plug = await Plugin.findById(args.id)
    const plugOrgList = plug.installedOrgs;
    const isDuplicate = plugOrgList.includes(args.orgId)

    if (isDuplicate) {
        const result = await Plugin.findByIdAndUpdate(
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
        const result = await Plugin.findByIdAndUpdate(
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

    plug = await Plugin.findById(args.id)
    return plug;
}
