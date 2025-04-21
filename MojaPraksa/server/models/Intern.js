const mongoose = require('mongoose');

const internSchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    name: { type: String, required: true },
    experience: { type: String, required: true },
    email: { type: String, required: true },
});

module.exports = mongoose.model('Intern', internSchema);
