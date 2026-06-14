/**
 * Blockchain Routes
 *
 * Mendefinisikan semua route/endpoint terkait data blockchain.
 * Setiap route dihubungkan dengan controller yang sesuai.
 */

const express = require("express");
const router = express.Router();

// Import controller
const {
  getTransactions,
  getSimpleTransactions,
  getRoles,
  produceMedicine,
  sendToDistributor,
  receiveByDistributor,
  sendToApotek,
  receiveByApotek,
  getMedicineById,
  getAllMedicines,
} = require("../controllers/blockchainController");

// ============================================
// Route Definitions
// ============================================

/**
 * GET /api/transactions
 * Mengambil seluruh data transaksi lengkap dari smart contract
 */
router.get("/transactions", getTransactions);

/**
 * GET /api/transactions/simple
 * Mengambil data transaksi dalam format sederhana
 * (hash, from, to, timestamp yang mudah dibaca)
 */
router.get("/transactions/simple", getSimpleTransactions);

// ============================================
// Role Routes
// ============================================

/**
 * GET /api/roles
 * Mendapatkan alamat untuk setiap role (produsen, distributor, apotek)
 */
router.get("/roles", getRoles);

// ============================================
// Medicine Routes (role-based, sesuai HealthChain.sol)
// ============================================

/**
 * POST /api/medicine/produce
 * Produsen mendaftarkan obat baru
 * Body: { nama, actorAddress }
 */
router.post("/medicine/produce", produceMedicine);

/**
 * POST /api/medicine/send-distributor
 * Produsen mengirim obat ke distributor
 * Body: { id, actorAddress }
 */
router.post("/medicine/send-distributor", sendToDistributor);

/**
 * POST /api/medicine/receive-distributor
 * Distributor konfirmasi penerimaan
 * Body: { id, actorAddress }
 */
router.post("/medicine/receive-distributor", receiveByDistributor);

/**
 * POST /api/medicine/send-apotek
 * Distributor kirim obat ke apotek
 * Body: { id, actorAddress }
 */
router.post("/medicine/send-apotek", sendToApotek);

/**
 * POST /api/medicine/receive-apotek
 * Apotek konfirmasi penerimaan
 * Body: { id, actorAddress }
 */
router.post("/medicine/receive-apotek", receiveByApotek);

/**
 * GET /api/medicine/:id
 * Lacak obat berdasarkan ID
 */
router.get("/medicine/:id", getMedicineById);

/**
 * GET /api/medicine
 * Semua obat terdaftar
 */
router.get("/medicine", getAllMedicines);

module.exports = router;
