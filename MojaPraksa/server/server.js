import path from 'path';
import { fileURLToPath } from 'url';
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/questions", require("./routes/questionRoutes"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/entries", require("./routes/entryRoutes"));
app.use("/api/companies", require("./routes/companyRoutes"));
app.use("/api/interns", require("./routes/internRoutes"));
app.use("/api/email", require("./routes/emailRoutes"));
app.use("/uploads", express.static("uploads"));

// Get the current file and directory paths for serving the React app
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log(__dirname); // This will print the directory of the current file

// Serve React static files from the 'client/mojapraksa/build' directory
app.use(express.static(path.join(__dirname, 'client/mojapraksa/build')));

// Handle all routes by sending the React app's index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/mojapraksa/build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
