const { exec } = require("child_process");
const mysql = require("mysql2");

// DB connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Admin",
  database: "network_monitor"
});

db.connect((err) => {
  if (err) {
    console.error("❌ DB connection failed:", err);
    return;
  }
  console.log("✅ Connected to MySQL");
});

// Run Nmap
exec('"C:\\Program Files (x86)\\Nmap\\nmap.exe" -sn 192.168.1.0/24', (err, stdout) => {
  if (err) {
    console.error("❌ Scan error:", err);
    return;
  }

  console.log("🔥 Scan completed");

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

    console.log(`➡️ Processing: ${ip}`);

    db.query(
      "INSERT INTO devices (ip_address, mac_address, vendor) VALUES (?, ?, ?)",
      [ip, mac, vendor],
      (err) => {
        if (err) {
          console.error(`❌ Insert failed for ${ip}:`, err);
        } else {
          console.log(`✅ Saved: ${ip}`);
        }
      }
    );
  });
});