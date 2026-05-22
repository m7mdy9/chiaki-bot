const mongoose = require('mongoose')

async function connectDB(){
    if(!process.env.mongo){
        console.error("The mongodb token is missing.")
        process.exit(1)
    }
    
    mongoose.connection.on("connected", ()=>{
        console.log("Connected to the Database")
    })
    mongoose.connection.on("error", (err)=>{console.error("An error has occured within the DB: ",err)})
    mongoose.connection.on("disconnected", ()=>{console.warn("DB disconnected.")})
    try {
        mongoose.connect(process.env.mongo, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        })
    } catch(err){
        console.error("MongoDB connection failed.\nError:", err)
        process.exit(1)
    }
}

module.exports = {connectDB}