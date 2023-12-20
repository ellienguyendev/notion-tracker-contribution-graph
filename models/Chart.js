const mongoose = require("mongoose");

const ChartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  integrationKey: {
    type: String,
    required: true
  },
  chartName: {
    type: String,
    required: true,
  },
  databaseId: {
    type: String,
    required: true,
  },
  numberOfHabits: {
    type: Number,
    required: true
  },
  habitNames: {
    type: Array,
    required: true
  },
  dateProperty: {
    type: String,
    required: true
  },
  completedProperty: {
    type: String,
    required: true
  },
  trackingName: {
    type: String,
    required: true
  },
  chartColor: {
    type: String,
    required: true
  },
  chartMode: {
    type: String,
    required: true
  },
  chartBackground: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("Chart", ChartSchema);
