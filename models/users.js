const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  token: { type: String, default: '' },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
  rewards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'rewards' }],
}, { timestamps: true });  // Ajoute createdAt et updatedAt

const User = mongoose.model('User', userSchema);

module.exports = User;

