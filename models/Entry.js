const mongoose = require("mongoose");

const EntrySchema = new mongoose.Schema({
  chartId: {
    type: mongoose.Schema.Types.ObjectId
  },
  date: {
    type: String,
    required: true
  },
  dayOfYear: {
    type: Number,
    required: true,
  },
  hoverText: {
    type: String,
    required: true,
  },
  opacity: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("Entry", EntrySchema);
