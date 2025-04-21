const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    name: { type: String, required: true },
    logo: { type: String, required: true },
    about: { type: String }, // kratak opis za početnu
    detailedDescription: { type: String }, // duži tekst samo za detaljnu stranicu
    email: { type: String, required: true, unique: true },
});

module.exports = mongoose.model('Company', companySchema);
