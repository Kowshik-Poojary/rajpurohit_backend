const mongoose = require("mongoose");

const senderSchema = new mongoose.Schema({
  name: String
});

module.exports = mongoose.model("Sender", senderSchema);
