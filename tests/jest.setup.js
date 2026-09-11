const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

let mongoServer;

beforeAll(async ()=>{
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    console.log(uri)
    await mongoose.connect(uri);
})

afterEach(async ()=>{
    const collections = mongoose.connection.collections;
    if(collections?.size > 0) console.log(collections);
    for (const key in collections){
        await collections[key].deleteMany({})
    }
})

afterAll(async ()=>{
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
})