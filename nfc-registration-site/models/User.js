// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: String,
  name: String,
  matric: String,
  phone: String,
  faceEncoding: [Number],
});

module.exports = mongoose.model('User', userSchema);

