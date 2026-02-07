const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  city_name: String
});

module.exports = mongoose.model("Location", locationSchema);
