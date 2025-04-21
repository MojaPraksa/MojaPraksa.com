const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Login ruta
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Proveri da li korisnik postoji u bazi
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // Proveri lozinku
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Generiši JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware za autentifikaciju
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: "Access token missing" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });

    req.user = user;
    next();
  });
};

// Middleware za proveru uloge
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Zabranjen pristup!" });
    }
    next();
  };
};

// Registracija korisnika (samo za admina)
router.post("/register", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  const { username, email, password, role = "user" } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword, role });
    await newUser.save();
    res.status(201).json({ message: "Korisnik uspješno registrovan!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ruta za prikaz svih korisnika (samo za admina)
router.get("/users", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Greška pri dohvatanju korisnika: ", error: error.message });
  }
});

// Editovanje korisnika (samo za admina)
router.put("/users/:id", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  const { id } = req.params;
  const { username, email, role } = req.body;

  try {
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ message: "Korisnik nije pronađen!" });

    // Ažuriraj korisničke podatke
    user.username = username || user.username;
    user.email = email || user.email;
    user.role = role || user.role;

    await user.save();
    res.status(200).json({ message: "Korisnik uspješno ažuriran!", user });
  } catch (err) {
    res.status(500).json({ message: "Greška pri ažuriranju korisnika:", error: err.message });
  }
});

// Brisanje korisnika (samo za admina)
router.delete("/users/:id", authenticateToken, authorizeRoles("admin"), async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id); // ✅ Direktno brisanje

    if (!user) {
      return res.status(404).json({ message: "Korisnik nije pronađen!" });
    }

    res.status(200).json({ message: "Korisnik uspješno izbrisan!" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Greška pri birsanju korisnika:", error: err.message });
  }
});

// GET: Vrati korisničko ime na osnovu ID-a
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("username");
    if (!user) {
      return res.status(404).json({ message: "Korisnik nije pronađen!" });
    }
    res.json(user);
  } catch (error) {
    console.error("Greška pri dohvaćanju korisnika:", error);
    res.status(500).json({ error: "Greška na serveru!" });
  }
});


// Test ruta
router.get("/test", (req, res) => {
  res.json({ message: "Backend radi preko proxyja!" });
});

module.exports = router;
