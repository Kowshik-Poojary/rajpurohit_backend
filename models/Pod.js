const mongoose = require("mongoose");
const Counter = require("./Counter");

const podSchema = new mongoose.Schema({
  podNumber: { type: Number, unique: true }, // 🔥 AUTO INCREMENT POD NO

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

podSchema.pre("save", async function () {
  if (this.podNumber) return;

  const counter = await Counter.findByIdAndUpdate(
    { _id: "podNumber" },
    {
      $inc: { seq: 1 },
      $setOnInsert: { seq: 999 } 
    },
    { new: true, upsert: true }
  );

  this.podNumber = counter.seq;
});



module.exports = mongoose.model("Pod", podSchema);
