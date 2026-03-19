const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ DATABASE CONNECTION (LOCAL for now)
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Admin",
  database: "network_monitor",
  waitForConnections: true,
  connectionLimit: 10
});

// 🔐 LOGIN ROUTE
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, results) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ success: false });
      }

      if (results.length > 0) {
        res.json({ success: true });
      } else {
        res.json({ success: false });
      }
    }
  );
});

// 📡 GET ALL DEVICES
app.get("/devices", (req, res) => {
  db.query("SELECT * FROM devices ORDER BY last_seen DESC", (err, results) => {
    if (err) {
      console.error("Fetch devices error:", err);
      return res.status(500).json([]);
    }
    res.json(results);
  });
});

// 🚨 GET NEW DEVICES
app.get("/devices/new", (req, res) => {
  db.query("SELECT * FROM devices WHERE is_new = TRUE", (err, results) => {
    if (err) {
      console.error("Fetch new devices error:", err);
      return res.status(500).json([]);
    }
    res.json(results);
  });
});

// ✅ MARK DEVICE AS SEEN
app.put("/devices/:id/seen", (req, res) => {
  db.query(
    "UPDATE devices SET is_new = FALSE WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) {
        console.error("Update error:", err);
        return res.status(500).json({ success: false });
      }
      res.json({ success: true });
    }
  );
});

// 🌐 ROOT ROUTE (FOR TESTING DEPLOYMENT)
app.get("/", (req, res) => {
  res.send("🚀 Network Monitor API is running on Render");
});

// ⚠️ SCANNER DISABLED FOR RENDER (LOCAL ONLY)
// function scanNetwork() {
//   console.log("Scanning...");
// }
// setInterval(scanNetwork, 30000);

// 🚀 START SERVER (RENDER COMPATIBLE)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});