import path from 'path';
import { fileURLToPath } from 'url';

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const path = require("path");

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/questions", require("./routes/questionRoutes"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/entries", require("./routes/entryRoutes"));
app.use("/api/companies", require("./routes/companyRoutes"));
app.use("/api/interns", require("./routes/internRoutes"));
app.use("/api/email", require("./routes/emailRoutes"));
app.use("/uploads", express.static("uploads"));

//
const __filename=fileURLToPath(import.meta.url)
const __dirname=path.dirname(__filename)
console.log(__dirname)

app.use(express.static(path.join(__dirname, 'client/mojapraksa/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/mojapraksa/build', 'index.html'));
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
