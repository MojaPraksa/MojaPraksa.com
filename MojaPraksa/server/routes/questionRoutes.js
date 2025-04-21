const express = require("express");
const router = express.Router();
const Question = require("../models/Question");

// Dohvati 15 pitanja iz baze
router.get("/", async (req, res) => {
    try {
        const questions = await Question.aggregate([{ $sample: { size: 15 } }]);
        res.json(questions);
    } catch (error) {
        res.status(500).json({ error: "Error fetching questions" });
    }
});

// Obradi odgovore korisnika i vrati rezultat
router.post("/submit", async (req, res) => {
    try {
        const { answers } = req.body;
        const questions = await Question.find({ _id: { $in: Object.keys(answers) } });

        let correctCount = 0;
        questions.forEach(q => {
            if (q.tacan_odgovor === answers[q._id]) correctCount++;
        });

        let resultTitle = "";
        let resultDescription = "";

        if (correctCount < 7) {
            resultTitle = "Rezultat ispod prosjeka";
            resultDescription = "Vaše trenutne vještine i način razmišljanja možda su bolje prilagođeni drugim vrstama poslova.";
        } else if (correctCount <= 10) {
            resultTitle = "Prosječni rezultat";
            resultDescription = "Imate dobru osnovu za rad u IT sektoru. Vaše vještine i način razmišljanja već su na dobrom putu, ali postoji prostor za daljnje usavršavanje. Uz dodatno istraživanje, praksu i usmjerenje, mogli biste razviti ključne vještine koje su potrebne za uspjeh u ovom području.";
        } else {
            resultTitle = "Nadprosječni rezultat";
            resultDescription = "IT je definitivno područje u kojem biste mogli ostvariti uspjeh. Vaš način razmišljanja i sposobnost rješavanja problema su iznad prosjeka, što vas čini odličnim kandidatom za karijeru u tehnologiji. S daljnjim usavršavanjem i radom na specifičnim vještinama, možete postići izvrsnost i ostvariti uspjeh u dinamičnom IT sektoru.";
        }

        res.json({ correctCount, resultTitle, resultDescription });
    } catch (error) {
        res.status(500).json({ error: "Error processing answers" });
    }
});

module.exports = router;

