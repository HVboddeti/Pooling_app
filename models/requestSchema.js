const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    poolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AvailablePool'
    },
    riderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    riderName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2
    },
    riderPhone: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: (value) => /^\d{10}$/.test(value),
            message: props => `${props.value} is not a valid 10-digit phone number`
        }
    },
    pickupLocation: {
        type: String,
        required: true,
        trim: true,
        minlength: 2
    },
    dropLocation: {
        type: String,
        required: true,
        trim: true,
        minlength: 2
    },
    numberOfPersons: {
        type: Number,
        required: true,
        min: 1,
        validate: {
            validator: Number.isInteger,
            message: '{VALUE} is not an integer value for numberOfPersons'
        }
    },
    requestNote: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted'],
        default: 'Pending'
    },
    driverName: {
        type: String
    },
    time: {
        type: Date
    },
    isCustomRequest: {
        type: Boolean,
        default: false
    },
    assignedPoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AvailablePool',
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('RequestRide', requestSchema);