const mongoose = require("mongoose");

const manualPodSchema = new mongoose.Schema({
  // ===== UPDATED: Changed to String to store "R12345" format =====
  // Frontend sends the POD number WITHOUT R prefix: 12345
  podNumber: { type: String, unique: true, required: true }, // MANUAL POD NO (USER ENTERS without R)
  
  from1: String,
  to1: String,
  origin: String,
  destination: String,
  doc: String,
  // ===== UPDATED: Changed to support decimal values (max 2 decimals) =====
  weight: {
    type: Number,
    validate: {
      validator: function(v) {
        if (v === null || v === undefined) return true;
        // Check if value has more than 2 decimal places
        const decimalPlaces = (v.toString().split('.')[1] || '').length;
        return decimalPlaces <= 2;
      },
      message: 'Weight can have maximum 2 decimal places'
    }
  },
  vol_weight: {
    type: Number,
    validate: {
      validator: function(v) {
        if (v === null || v === undefined) return true;
        // Check if value has more than 2 decimal places
        const decimalPlaces = (v.toString().split('.')[1] || '').length;
        return decimalPlaces <= 2;
      },
      message: 'Volumetric weight can have maximum 2 decimal places'
    }
  },
  pieces: Number,
  amount: {
    type: Number,
    validate: {
      validator: function(v) {
        if (v === null || v === undefined) return true;
        // Check if value has more than 2 decimal places
        const decimalPlaces = (v.toString().split('.')[1] || '').length;
        return decimalPlaces <= 2;
      },
      message: 'Amount can have maximum 2 decimal places'
    }
  },
  status1: String,
  sender: String,
  date1: { type: Date, required: true } // MANUAL DATE (USER ENTERS)
});

// ✅ NO PRE-SAVE HOOK - Since POD number is manually entered
// Frontend handles the R prefix removal and sends just the number: 12345
// Backend just stores as-is: "12345"
// This ensures zero conflicts with auto-increment PODs

module.exports = mongoose.model("ManualPod", manualPodSchema);