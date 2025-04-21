const mongoose = require("mongoose");

const entrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    date: { type: Date, required: true },
    activity: { type: String, required: true },
    description: { type: String },
    arrivalTime: { type: String, required: true },
    departureTime: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Entry", entrySchema);
