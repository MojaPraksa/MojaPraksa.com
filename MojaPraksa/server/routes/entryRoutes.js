const express = require("express");
const Entry = require("../models/Entry");
const User = require("../models/User");
const router = express.Router();
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const path = require("path");

// Funkcija za izračunavanje trajanja između dolaska i odlaska
const calculateDuration = (arrivalTime, departureTime) => {
  const arrival = new Date(`1970-01-01T${arrivalTime}:00Z`);
  const departure = new Date(`1970-01-01T${departureTime}:00Z`);
  const durationInMs = departure - arrival;
  return durationInMs / (1000 * 60 * 60); // Trajanje u satima
};

//POST: Dodavanje novog unosa (proverava da li korisnik postoji)
router.post("/", async (req, res) => {
  try {
    const { userId, date, activity, description, arrivalTime, departureTime } = req.body;

    // Provera da li korisnik postoji
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return res.status(400).json({ error: "Korisnik ne postoji!" });
    }

    // Kreiraj novi unos
    const newEntry = new Entry({ userId, date, activity, description, arrivalTime, departureTime });
    const savedEntry = await newEntry.save();
    res.status(201).json(savedEntry);
  } catch (error) {
    console.error("Greška prilikom čuvanja unosa:", error);
    res.status(400).json({ error: error.message });
  }
});

//GET: Dohvati sve unose za određenog korisnika
router.get("/:userId", async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);
    const entries = await Entry.find({ userId }).select("-__v -createdAt -updatedAt"); // Uklanjamo nepotrebna polja

    if (!entries.length) {
      return res.status(404).json({ message: "Nema unosa za ovog korisnika." });
    }

    res.json(entries);
  } catch (error) {
    console.error("Greška pri dohvaćanju unosa:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

// PUT: Ažuriranje unosa po ID-u
router.put("/:id", async (req, res) => {
  try {
    const updatedEntry = await Entry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedEntry) {
      return res.status(404).json({ message: "Unos nije pronađen." });
    }
    res.json(updatedEntry);
  } catch (error) {
    console.error("Greška pri ažuriranju unosa:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

// DELETE: Brisanje unosa po ID-u
router.delete("/:id", async (req, res) => {
  try {
    const deletedEntry = await Entry.findByIdAndDelete(req.params.id);
    if (!deletedEntry) {
      return res.status(404).json({ message: "Unos nije pronađen." });
    }
    res.json({ message: "Unos je uspješno izbrisan." });
  } catch (error) {
    console.error("Greška pri brisanju unosa:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

// Backend: Generisanje PDF-a sa svim unosima korisnika
// ✅ GET: Generisanje PDF-a
router.get("/generate-pdf/:id", async (req, res) => {
  try {
    const entries = await Entry.find({ userId: req.params.id });
    const user = await User.findById(req.params.id);
    if (!entries || !user) {
      return res.status(404).json({ message: "Korisnik ili unosi nisu pronađeni." });
    }


    const doc = new PDFDocument({ margin: 50 });
    const fontPath = path.join(__dirname, "../fonts/DejaVuSans.ttf");
    const fontPathBold = path.join(__dirname, "../fonts/DejaVuSans-Bold.ttf"); // provjeri da se tačno tako zove!

    doc.registerFont("DejaVu", fontPath);
    doc.registerFont("DejaVu-Bold", fontPathBold);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=dnevnik-${user.username}.pdf`);
    doc.pipe(res);

    const pageWidth = doc.page.width;
    const marginLeft = doc.options.margin;  // Definira lijevu marginu
    const marginRight = doc.options.margin; // Definira desnu marginu
    const availableWidth = pageWidth - marginLeft - marginRight; // Ukupna širina dostupna za tabelu
    const colWidth = availableWidth / 4;  // Podijeli dostupnu širinu na 4 kolone
    const rowHeight = 20;

    let totalDuration = 0;

    doc.fontSize(20).text("Dnevnik Rada", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Korisnik: ${user.username} (${user.email})`);
    doc.moveDown(0.5);
    doc.fontSize(14).text("Unosi:");

    entries.forEach((entry, index) => {
      const duration = calculateDuration(entry.arrivalTime, entry.departureTime);
      totalDuration += duration;

      // Aktivnost
      doc.moveDown(0.5).fontSize(16).font('DejaVu-Bold').text(`${index + 1}. ${entry.activity}`);
      doc.font('DejaVu').fontSize(12).moveDown(0.3);

      const startX = marginLeft; // Početna pozicija na lijevoj margini
      const startY = doc.y; // Početna y koordinata na trenutnu poziciju

      const headers = ["Datum", "Vrijeme dolaska", "Vrijeme odlaska", "Vrijeme trajanja"];
      const values = [
        new Date(entry.date).toLocaleDateString("hr-HR"),
        entry.arrivalTime,
        entry.departureTime,
        `${duration.toFixed(2)} sati`,
      ];

      // Ispisivanje zaglavlja
      headers.forEach((text, i) => {
        doc.rect(startX + i * colWidth, startY, colWidth, rowHeight).stroke();
        doc.text(text, startX + i * colWidth + 5, startY + 5);
      });

      // Ispisivanje vrijednosti
      values.forEach((text, i) => {
        doc.rect(startX + i * colWidth, startY + rowHeight, colWidth, rowHeight).stroke();
        doc.text(text, startX + i * colWidth + 5, startY + rowHeight + 5);
      });

      // Ispod tabele - grupiranje redova
      const details = [
        { label: "Opis", value: entry.description || "Nema opisa" },
      ];

      // Ispisivanje grupiranih redova
      details.forEach(detail => {
        doc.moveDown(0.8); // Razmak nakon prethodnog sadržaja
        doc.fontSize(12).text(`${detail.label}:`, marginLeft, doc.y); // Prvo ispisivanje labela
        doc.moveDown(0.2);
        doc.text(detail.value, marginLeft, doc.y, { width: availableWidth, align: "left" }); // Ispisivanje vrijednosti
      });

    });

    doc.moveDown(1).fontSize(14).text(`Ukupno vrijeme: ${totalDuration.toFixed(2)} sati`);
    doc.end();
  } catch (error) {
    console.error("Greška pri generiranju PDF-a:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

module.exports = router;
