const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    poolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AvailablePool'
    },
    riderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Reference to the User model
    },
    riderName: String,
    riderPhone: String,
    pickupLocation: String,
    dropLocation: String,
    numberOfPersons: {
        type: Number,
        required: true,
        min: 1
    },
    requestNote: String,
    status: {
        type: String,
        enum: ['Pending', 'Accepted'],
        default: 'Pending'
    },
    driverName: String,
    time: Date
});

module.exports = mongoose.model('RequestRide', requestSchema);