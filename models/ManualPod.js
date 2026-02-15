const mongoose = require("mongoose");

const manualPodSchema = new mongoose.Schema({
  podNumber: { type: Number, unique: true, required: true }, // 🔥 MANUAL POD NO (USER ENTERS)
  
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
  date1: { type: Date, required: true } // 🔥 MANUAL DATE (USER ENTERS)
});

// ✅ NO PRE-SAVE HOOK - Since POD number is manually entered
// This ensures zero conflicts with auto-increment PODs

module.exports = mongoose.model("ManualPod", manualPodSchema);