const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
  email: {
      type: String,
      required: true,
      unique: true,
      trim: true
  },
  password: {
      type: String,
      required: true,
      minlength: 8
  },
  firstName: {
      type: String,
      required: true,
      minlength: 2,
      trim: true
  },
  lastName: {
      type: String,
      required: true,
      minlength: 2,
      trim: true
  },
  mobileNumber: {
      type: String,
      required: true,
      validate: {
          validator: (value) => /^\d{10}$/.test(value),
          message: props => `${props.value} is not a valid 10-digit mobile number`
      }
  },
  optionalMobileNumber: {
      type: String,
      validate: {
          validator: (value) => /^\d{10}$/.test(value),
          message: props => `${props.value} is not a valid 10-digit mobile number`
      }
  }
});

module.exports = mongoose.model('User', userSchema);
