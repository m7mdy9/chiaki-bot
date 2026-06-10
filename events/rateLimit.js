module.exports = {
    name: 'rateLimit',
    execute(rateLimitInfo){
        console.warn(`${process.env.YELLOW}Rate Limit hit: ${process.env.RESET}`, rateLimitInfo)
    }
}