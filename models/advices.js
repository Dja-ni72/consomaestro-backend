const mongoose = require('mongoose');


const adviceSchema = mongoose.Schema({
  titre: String,
  description: String,
});

const Advice = mongoose.model('advices', adviceSchema);


module.exports = Advice;