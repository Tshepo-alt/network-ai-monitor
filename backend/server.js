const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const { exec } = require("child_process");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ DATABASE CONNECTION
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
      if (err) return res.status(500).json({ success: false });

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
    if (err) return res.status(500).json([]);
    res.json(results);
  });
});

// 🚨 GET NEW DEVICES
app.get("/devices/new", (req, res) => {
  db.query("SELECT * FROM devices WHERE is_new = TRUE", (err, results) => {
    if (err) return res.status(500).json([]);
    res.json(results);
  });
});

// ✅ MARK DEVICE AS SEEN
app.put("/devices/:id/seen", (req, res) => {
  db.query(
    "UPDATE devices SET is_new = FALSE WHERE id = ?",
    [req.params.id],
    () => res.json({ success: true })
  );
});

// 🔍 NETWORK SCANNER
function scanNetwork() {
  console.log("🔍 Scanning network...");

  exec('"C:\\Program Files (x86)\\Nmap\\nmap.exe" -sn 192.168.1.1-255', (err, stdout, stderr) => {
    
    if (err) {
      console.error("❌ Scan failed:", err.message);
      return;
    }

    if (!stdout) {
      console.log("⚠️ No output from scan");
      return;
    }

    console.log("📡 Raw scan output:\n", stdout); // DEBUG

    const devices = stdout.split("Nmap scan report for ").slice(1);

    devices.forEach(device => {
      const lines = device.split("\n");

      const ip = lines[0].trim().split(" ")[0];

      let mac = "Unknown";
      let vendor = "Unknown";

      lines.forEach(line => {
        if (line.includes("MAC Address")) {
          const parts = line.split(" ");
          mac = parts[2];
          vendor = parts.slice(3).join(" ").replace(/[()]/g, "");
        }
      });

      console.log("➡️ Found device:", ip, mac, vendor);

      db.query(
        "SELECT * FROM devices WHERE ip_address = ?",
        [ip],
        (err, results) => {

          if (err) {
            console.error("DB SELECT ERROR:", err);
            return;
          }

          if (results.length === 0) {
            db.query(
              "INSERT INTO devices (ip_address, mac_address, vendor, is_new) VALUES (?, ?, ?, TRUE)",
              [ip, mac, vendor],
              (err) => {
                if (err) {
                  console.error("❌ INSERT ERROR:", err);
                } else {
                  console.log("🚨 NEW DEVICE SAVED:", ip);
                }
              }
            );
          } else {
            db.query(
              "UPDATE devices SET last_seen = CURRENT_TIMESTAMP WHERE ip_address = ?",
              [ip]
            );
          }
        }
      );
    });
  });
}