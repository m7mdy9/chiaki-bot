const { reportBugBLModel } = require("./reportBugBlacklist.js");
const { reportCardModel } = require("./reportCard.js");
const { reportCardBLModel } = require("./reportCardBlacklist.js");
const { reportUserBLModel } = require("./reportUserBlacklist.js");
const { reportsModel } = require("./reports.js");
const { votingEntryModel } = require("./votingEntry.js");
const { votingTimeModel } = require("./votingTimes.js");
const { warningModel } = require("./warnings.js");
const { reportUserModel } = require("./reportUser.js")
const { autoroleModel } = require("./autorole.js")

module.exports = {
    reportBugBLModel,
    reportCardModel,
    reportCardBLModel,
    reportUserBLModel,
    reportsModel,
    votingEntryModel,
    votingTimeModel,
    warningModel,
    reportUserModel,
    autoroleModel,
}

// Dyanmic file registry, however the auto suggestions wont work!
// const fs = require('fs')
// const path = require('path')
// const models = {}

// fs.readdirSync(__dirname).forEach(file =>{

//     if (file === "index.js" || !file.endsWith(".js")) return;

//     const modelModule = require(path.join(__dirname, file));

//     Object.assign(models, modelModule)
//     console.log(modelModule)
// })

// console.log(models)
// module.exports = models
