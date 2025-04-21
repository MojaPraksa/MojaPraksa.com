const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
    pitanje: String,
    odgovori: [String],
    tacan_odgovor: String,
});

module.exports = mongoose.model("Question", QuestionSchema);
