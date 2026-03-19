const mongoose = require("mongoose");

const manualPodSchema = new mongoose.Schema({
  // ===== UPDATED: Changed to String to store "R12345" format =====
  // Frontend sends the POD number WITH R prefix already: "R12345"
  podNumber: { type: String, unique: true, required: true }, // MANUAL POD NO (USER ENTERS with R prefix)
  
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
  date1: { type: Date, required: true } // MANUAL DATE (USER ENTERS)
});

// ✅ NO PRE-SAVE HOOK - Since POD number is manually entered with R prefix already
// Frontend handles the R prefix formatting and sends it to backend
// Backend just stores as-is: "R12345"
// This ensures zero conflicts with auto-increment PODs

module.exports = mongoose.model("ManualPod", manualPodSchema);