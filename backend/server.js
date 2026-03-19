const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

// 🛡️ PREVENT CRASHES
process.on("uncaughtException", (err) => {
  console.error("🔥 Uncaught Exception:", err.message);
});

process.on("unhandledRejection", (err) => {
  console.error("🔥 Unhandled Rejection:", err);
});

app.use(cors());
app.use(express.json());

// ✅ DATABASE CONNECTION (SAFE)
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "Admin",
  database: process.env.DB_NAME || "network_monitor",
  waitForConnections: true,
  connectionLimit: 10
});

// ✅ TEST CONNECTION (DO NOT CRASH)
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Connected to MySQL");
    connection.release();
  }
});

// 🌐 ROOT ROUTE
app.get("/", (req, res) => {
  res.send("🚀 Network Monitor API is running");
});

// 🔐 LOGIN ROUTE (SAFE)
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, results) => {
      if (err) {
        console.error("Login error:", err.message);
        return res.json({ success: false });
      }

      res.json({ success: results.length > 0 });
    }
  );
});

// 📡 GET DEVICES
app.get("/devices", (req, res) => {
  db.query("SELECT * FROM devices ORDER BY last_seen DESC", (err, results) => {
    if (err) {
      console.error("Fetch devices error:", err.message);
      return res.json([]);
    }
    res.json(results);
  });
});

// 🚨 GET NEW DEVICES
app.get("/devices/new", (req, res) => {
  db.query("SELECT * FROM devices WHERE is_new = TRUE", (err, results) => {
    if (err) {
      console.error("Fetch new devices error:", err.message);
      return res.json([]);
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
        console.error("Update error:", err.message);
        return res.json({ success: false });
      }
      res.json({ success: true });
    }
  );
});

// 🚀 START SERVER (RENDER SAFE)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});