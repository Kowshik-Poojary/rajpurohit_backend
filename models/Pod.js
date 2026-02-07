const mongoose = require("mongoose");

const podSchema = new mongoose.Schema({
  from1: String,
  to1: String,
  origin: String,
  destination: String,
  doc: String,
  weight: Number,
  vol_weight: Number,
  pieces: Number,
  amount: Number,
  status1: String,
  sender: String,
  date1: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Pod", podSchema);
