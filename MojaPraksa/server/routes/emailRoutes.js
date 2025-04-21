const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
require('dotenv').config();
const Company = require('../models/Company');

const router = express.Router();
const upload = multer();

router.post('/apply', upload.fields([{ name: 'cv' }, { name: 'motivation' }]), async (req, res) => {
    const { name, email, companyId } = req.body;
    const cv = req.files['cv'][0];
    const motivation = req.files['motivation'][0];

    try {
        // Dohvati email kompanije iz baze
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        const mailOptions = {
            from: email,
            to: company.email, // ✨ šalje se kompaniji
            subject: `Prijava za praksu - ${name}`,
            text: `Ime: ${name}\nEmail: ${email}`,
            attachments: [
                { filename: cv.originalname, content: cv.buffer },
                { filename: motivation.originalname, content: motivation.buffer },
            ],
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) return res.status(500).send(error.toString());
            res.send('Email sent: ' + info.response);
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router; // **CommonJS način eksportovanja**
