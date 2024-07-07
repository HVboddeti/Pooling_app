const mongoose = require('mongoose');

const historicalRideSchema = new mongoose.Schema({
    poolId: { type: mongoose.Schema.Types.ObjectId, required: false },
    driverName: { type: String, required: false },
    driverPhone: { type: String, required: false },
    driverNote: { type: String, required: false },
    pickupLocation: { type: String, required: false },
    dropLocation: { type: String, required: false },
    time: { type: Date, required: false },
    seats: { type: Number, required: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, required: false },
    requests: [{
        riderId: { type: mongoose.Schema.Types.ObjectId, required: false },
        riderName: { type: String, required: false },
        riderPhone: { type: String, required: false },
        pickupLocation: { type: String, required: false },
        dropLocation: { type: String, required: false },
        requestNote: { type: String, required: false },
        status: { type: String, required: false },
        createdAt: { type: Date, default: Date.now }
    }]
}, { strict: false });

const HistoricalRide = mongoose.model('HistoricalRide', historicalRideSchema, 'history');
module.exports = HistoricalRide;