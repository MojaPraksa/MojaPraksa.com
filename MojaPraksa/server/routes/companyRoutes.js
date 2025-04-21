const express = require('express');
const mongoose = require('mongoose');
const multer = require("multer");
const upload = require("../middleware/upload");
const path = require("path");
const Company = require('../models/Company');

const router = express.Router();

// Konfiguracija za čuvanje slika
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/"); // folder gdje se slike čuvaju
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // npr. 164728123.png
    },
});

// GET sve kompanije (npr. za početnu stranicu) – bez detailedDescription
router.get('/', async (req, res) => {
    try {
        // Dohvatanje samo osnovnih podataka (name, logo, about, email)
        const companies = await Company.find({}, 'name logo about detailedDescription email');
        res.json(companies);
    } catch (error) {
        // Obrađivanje grešaka u GET metodi
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET jedna kompanija (npr. za detaljnu stranicu) – uključuje sve
router.get('/:id', async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);

        // Provjera da li firma postoji
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Vraćanje podataka firme sa svim informacijama
        res.json(company);
    } catch (error) {
        // Obrađivanje grešaka u GET metodi
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST – dodavanje nove kompanije (uključuje detailedDescription)
router.post("/", upload.single("logo"), async (req, res) => {
    try {
        const { name, about, detailedDescription, email } = req.body;
        const logoPath = req.file ? `/uploads/${req.file.filename}` : "";

        const company = new Company({
            name,
            about,
            detailedDescription,
            email,
            logo: logoPath,
        });

        await company.save();
        res.status(201).json(company);
    } catch (err) {
        res.status(500).json({ message: "Greška pri dodavanju kompanije." });
    }
});


// Ažuriranje postojeće kompanije (ako već postoji sa istim emailom)
router.put("/:id", upload.single("logo"), async (req, res) => {
    try {
        const { name, about, detailedDescription, email } = req.body;
        const logoPath = req.file ? `/uploads/${req.file.filename}` : undefined;

        const updateData = {
            name,
            about,
            detailedDescription,
            email,
        };

        if (logoPath) updateData.logo = logoPath;

        const updated = await Company.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: "Greška pri ažuriranju kompanije." });
    }
});

// DELETE – Obriši kompaniju
router.delete('/:id', async (req, res) => {
    try {
        const company = await Company.findByIdAndDelete(req.params.id);
        if (!company) return res.status(404).json({ message: 'Company not found' });

        res.status(200).json({ message: 'Company deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


module.exports = router;
