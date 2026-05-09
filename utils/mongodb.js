require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
const connect_db = async () => {
    try {
        await mongoose.connect(process.env.mongo);
        console.log('Hey hey! We connected to MongoDB!');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1); // Exit the process if the connection fails
    }
};

// // Define the user schema
// const suspension_Schema = new mongoose.Schema({
//     discordId: String,
//     suspeneded_name: String,
//     suspended_by: String,
//     suspender_id: String,
//     reason: String,
//     proof: String,
//     started_on: String,
//     expires_on: String,
//     in_days: String,
//     in_ms: String,
// });
// const strike_Schema = new mongoose.Schema({
//     striked_id: String,
//     striked_name: String,
//     strike_no: String,
//     striker_name: String,
//     striker_id: String,
//     reason: String,
//     proof: String,
//     started_on: String,
//     expiry_date: String,
//     in_ms: String,
// });

// // Create the User model
// const User = mongoose.model('Suspension', suspension_Schema);
// const StrikeDB = mongoose.model('Strike', strike_Schema)

// Export the User model and connect_db function
module.exports = {
    connect_db
};