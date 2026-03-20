const mongoose = require("mongoose");
const Counter = require("./Counter");

const podSchema = new mongoose.Schema({
  // ===== UPDATED: Changed to String to store "R12345" format =====
  podNumber: { type: String, unique: true }, // AUTO INCREMENT POD NO with R prefix

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
  date1: { type: Date, default: Date.now }
});

podSchema.pre("save", async function () {
  if (this.podNumber) return;

  let counter = await Counter.findById("podNumber");

  if (!counter) {
    // First time ever → start from 1000
    counter = await Counter.create({ _id: "podNumber", seq: 1000 });
  } else {
    // Increment normally
    counter.seq += 1;
    await counter.save();
  }

  // ===== UPDATED: Store with R prefix =====
  // Convert integer to string with R prefix: 1000 → "R1000"
  this.podNumber = `R${counter.seq}`;
});

module.exports = mongoose.model("Pod", podSchema);