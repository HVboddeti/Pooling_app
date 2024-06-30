const mongoose = require('mongoose');

const userInfoSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobileNumber: { type: String },
    optionalMobileNumber: { type: String },
});

module.exports = mongoose.model('UserInfo', userInfoSchema);
