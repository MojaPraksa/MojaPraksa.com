const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Provjeri postoji li "uploads" folder, ako ne – napravi ga
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + file.originalname;
        cb(null, uniqueSuffix);
    },
});

const upload = multer({ storage });

module.exports = upload;
