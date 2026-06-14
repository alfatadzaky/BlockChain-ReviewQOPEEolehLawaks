/**
 * Server Entry Point
 *
 * File utama untuk menjalankan Express server.
 * Backend ini digunakan untuk sistem pelacakan rantai pasok obat
 * berbasis blockchain, mengambil data transaksi dari smart contract
 * di Sepolia testnet via Etherscan API.
 */

// ============================================
// Load environment variables (harus paling awal)
// ============================================
require("dotenv").config();

// ============================================
// Import dependencies
// ============================================
const express = require("express");
const cors = require("cors");

// Import routes
const blockchainRoutes = require("./routes/blockchain");

// ============================================
// Inisialisasi Express app
// ============================================
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware
// ============================================

// Mengaktifkan CORS agar frontend bisa mengakses API
app.use(cors());

// Parsing JSON request body
app.use(express.json());

// ============================================
// Routes
// ============================================

// Route utama untuk cek status server
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Backend Rantai Pasok Obat - Blockchain API",
    version: "1.0.0",
    endpoints: {
      transactions: "GET /api/transactions",
      simpleTransactions: "GET /api/transactions/simple",
      roles: "GET /api/roles",
      medicines: "GET /api/medicine",
      produce: "POST /api/medicine/produce",
      sendDistributor: "POST /api/medicine/send-distributor",
      receiveDistributor: "POST /api/medicine/receive-distributor",
      sendApotek: "POST /api/medicine/send-apotek",
      receiveApotek: "POST /api/medicine/receive-apotek",
    },
  });
});

// Blockchain routes (prefix: /api)
app.use("/api", blockchainRoutes);

// ============================================
// Jalankan server
// ============================================
app.listen(PORT, () => {
  console.log("================================================");
  console.log("🚀 Server berjalan dengan sukses!");
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔗 Transaksi: http://localhost:${PORT}/api/transactions`);
  console.log(
    `📋 Sederhana:  http://localhost:${PORT}/api/transactions/simple`
  );
  console.log(`💊 Obat:       http://localhost:${PORT}/api/medicine`);
  console.log(`👤 Roles:      http://localhost:${PORT}/api/roles`);
  console.log("================================================");
});
