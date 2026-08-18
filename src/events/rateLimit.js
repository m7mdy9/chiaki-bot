const { YellowAscii, ResetAscii } = require("../utils/utils")

module.exports = {
    name: 'rateLimit',
    execute(rateLimitInfo){
        console.warn(`${YellowAscii}Rate Limit hit: ${ResetAscii}`, rateLimitInfo)
    }
}