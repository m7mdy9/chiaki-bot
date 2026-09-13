const { getPermissionNum } = require("../../../../src/utils/utils");

module.exports = {
    name: "permissioncmd",
    description: "permissioncmd",
    permissions: getPermissionNum("Administrator"),
    async execute(){
        return "permissioncmd";
    }
}