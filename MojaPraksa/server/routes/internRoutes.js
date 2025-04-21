const express = require('express');
const mongoose = require('mongoose');
const Intern = require('../models/Intern');

const router = express.Router();

router.get('/:companyId', async (req, res) => {
    const interns = await Intern.find({ companyId: req.params.companyId });
    res.json(interns);
});

// Dohvati sve interne
router.get('/', async (req, res) => {
    try {
        const interns = await Intern.find();
        res.json(interns);
    } catch (error) {
        res.status(500).json({ message: 'Greška na serveru', error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { companyId, name, experience, email } = req.body;

        // Provjera da li postoji kompanija kojoj pripada intern
        if (!mongoose.Types.ObjectId.isValid(companyId)) {
            return res.status(400).json({ message: 'Invalid companyId format' });
        }

        // Provjera da li intern već postoji sa istim emailom
        const existingIntern = await Intern.findOne({ email });
        if (existingIntern) {
            return res.status(400).json({ message: 'Intern with this email already exists' });
        }

        // Kreiranje novog interna
        const intern = new Intern({ companyId, name, experience, email });
        await intern.save();

        res.status(201).json(intern);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// PUT - Ažuriraj interna
router.put('/:id', async (req, res) => {
    try {
        const { companyId, name, experience, email } = req.body;
        const intern = await Intern.findById(req.params.id);

        if (!intern) return res.status(404).json({ message: 'Intern not found' });

        intern.companyId = companyId || intern.companyId;
        intern.name = name || intern.name;
        intern.experience = experience || intern.experience;
        intern.email = email || intern.email;

        await intern.save();
        res.status(200).json(intern);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// DELETE - Obriši interna
router.delete('/:id', async (req, res) => {
    try {
        const intern = await Intern.findByIdAndDelete(req.params.id);
        if (!intern) return res.status(404).json({ message: 'Intern not found' });

        res.status(200).json({ message: 'Intern deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});



module.exports = router; 
