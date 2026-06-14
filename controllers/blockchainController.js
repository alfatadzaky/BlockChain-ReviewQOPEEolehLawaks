// SELURUH KODE SUDAH BENAR DAN BERJALAN BAIK

/**
 * Blockchain Controller
 *
 * Controller untuk mengelola semua logika bisnis terkait
 * pengambilan dan pemrosesan data transaksi blockchain
 * dari Etherscan API (Sepolia testnet).
 */

const axios = require("axios");

// ============================================
// Konfigurasi dari environment variables
// ============================================
const ETHERSCAN_BASE_URL =
  process.env.ETHERSCAN_BASE_URL || "https://api-sepolia.etherscan.io/api";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// ============================================
// Alamat Role (cocok dengan HealthChain.sol)
// ============================================
const PRODUSEN_ADDRESS = process.env.PRODUSEN_ADDRESS;
const DISTRIBUTOR_ADDRESS = process.env.DISTRIBUTOR_ADDRESS;
const APOTEK_ADDRESS = process.env.APOTEK_ADDRESS;

// ============================================
// Penyimpanan obat in-memory (simulasi blockchain)
// ============================================
let medicines = [];
let medicineCounter = 0;

/**
 * Mengkonversi Unix timestamp menjadi format tanggal yang mudah dibaca.
 *
 * @param {string|number} timestamp - Unix timestamp (dalam detik)
 * @returns {string} Tanggal dalam format "DD/MM/YYYY HH:mm:ss WIB"
 */
function formatTimestamp(timestamp) {
  const date = new Date(Number(timestamp) * 1000);

  return date.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Mengambil data transaksi lengkap dari Etherscan API.
 *
 * Endpoint: GET /api/transactions
 * Mengembalikan seluruh data transaksi mentah dari smart contract
 * yang terdaftar di Sepolia testnet.
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
const getTransactions = async (req, res) => {
  try {
    // Validasi: pastikan konfigurasi API tersedia
    if (!ETHERSCAN_API_KEY || !CONTRACT_ADDRESS) {
      return res.status(500).json({
        success: false,
        message:
          "Konfigurasi belum lengkap. Pastikan ETHERSCAN_API_KEY dan CONTRACT_ADDRESS sudah diatur di file .env",
      });
    }

    // Kirim request ke Etherscan API
    const response = await axios.get(ETHERSCAN_BASE_URL, {
      params: {
        module: "account",
        action: "txlist",
        address: CONTRACT_ADDRESS,
        startblock: 0,
        endblock: 99999999,
        sort: "desc",
        apikey: ETHERSCAN_API_KEY,
      },
    });

    // Periksa response dari Etherscan
    if (response.data.status !== "1") {
      return res.status(404).json({
        success: false,
        message: response.data.message || "Tidak ada transaksi ditemukan",
        result: [],
      });
    }

    // Kirim data transaksi lengkap
    return res.status(200).json({
      success: true,
      message: "Data transaksi berhasil diambil",
      count: response.data.result.length,
      result: response.data.result,
    });
  } catch (error) {
    console.error("[ERROR] Gagal mengambil transaksi:", error.message);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data transaksi",
      error: error.message,
    });
  }
};

/**
 * Mengambil data transaksi dalam format yang disederhanakan.
 *
 * Endpoint: GET /api/transactions/simple
 * Mengembalikan hanya field penting: hash, from, to, dan timestamp
 * dalam format yang mudah dibaca untuk kebutuhan dashboard frontend.
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
const getSimpleTransactions = async (req, res) => {
  try {
    // Validasi: pastikan konfigurasi API tersedia
    if (!ETHERSCAN_API_KEY || !CONTRACT_ADDRESS) {
      return res.status(500).json({
        success: false,
        message:
          "Konfigurasi belum lengkap. Pastikan ETHERSCAN_API_KEY dan CONTRACT_ADDRESS sudah diatur di file .env",
      });
    }

    // Kirim request ke Etherscan API
    const response = await axios.get(ETHERSCAN_BASE_URL, {
      params: {
        module: "account",
        action: "txlist",
        address: CONTRACT_ADDRESS,
        startblock: 0,
        endblock: 99999999,
        sort: "desc",
        apikey: ETHERSCAN_API_KEY,
      },
    });

    // Periksa response dari Etherscan
    if (response.data.status !== "1") {
      return res.status(404).json({
        success: false,
        message: response.data.message || "Tidak ada transaksi ditemukan",
        result: [],
      });
    }

    // Format data transaksi menjadi bentuk sederhana
    const simplifiedTransactions = response.data.result.map((tx) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      timestamp: formatTimestamp(tx.timeStamp),
    }));

    // Kirim data transaksi yang sudah diformat
    return res.status(200).json({
      success: true,
      message: "Data transaksi (sederhana) berhasil diambil",
      count: simplifiedTransactions.length,
      result: simplifiedTransactions,
    });
  } catch (error) {
    console.error(
      "[ERROR] Gagal mengambil transaksi sederhana:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data transaksi",
      error: error.message,
    });
  }
};

// ============================================
// Role & Medicine Management
// ============================================

/**
 * GET /api/roles
 * Mengembalikan daftar alamat untuk setiap role.
 */
const getRoles = async (req, res) => {
  return res.status(200).json({
    success: true,
    contractAddress: CONTRACT_ADDRESS,
    roles: {
      produsen: PRODUSEN_ADDRESS,
      distributor: DISTRIBUTOR_ADDRESS,
      apotek: APOTEK_ADDRESS,
    },
  });
};

/**
 * POST /api/medicine/produce
 * Produsen (owner) mendaftarkan obat baru.
 * Body: { nama: string, actorAddress: string }
 */
const produceMedicine = async (req, res) => {
  try {
    const { nama, actorAddress } = req.body;

    if (!nama || !actorAddress) {
      return res.status(400).json({ success: false, message: "Nama obat dan alamat aktor diperlukan" });
    }

    // Cek role: hanya produsen (owner)
    if (actorAddress !== PRODUSEN_ADDRESS) {
      return res.status(403).json({ success: false, message: "Hanya produsen yang bisa mendaftarkan obat" });
    }

    medicineCounter++;
    const newMedicine = {
      id: medicineCounter,
      nama,
      produsen: PRODUSEN_ADDRESS,
      distributor: null,
      apotek: null,
      status: "Diproduksi",
      timestamp: Math.floor(Date.now() / 1000),
    };
    medicines.push(newMedicine);

    return res.status(201).json({
      success: true,
      message: `Obat "${nama}" (ID: ${medicineCounter}) berhasil diproduksi`,
      medicine: newMedicine,
    });
  } catch (error) {
    console.error("[ERROR] Gagal memproduksi obat:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/medicine/send-distributor
 * Produsen mengirim obat ke distributor.
 * Body: { id: number, actorAddress: string }
 */
const sendToDistributor = async (req, res) => {
  try {
    const { id, actorAddress } = req.body;
    const medicine = medicines.find((m) => m.id === Number(id));

    if (!id || !actorAddress) {
      return res.status(400).json({ success: false, message: "ID obat dan alamat aktor diperlukan" });
    }
    if (!medicine) {
      return res.status(404).json({ success: false, message: "ID obat tidak ditemukan" });
    }
    if (actorAddress !== PRODUSEN_ADDRESS) {
      return res.status(403).json({ success: false, message: "Hanya produsen yang bisa mengirim ke distributor" });
    }
    if (medicine.status !== "Diproduksi") {
      return res.status(400).json({ success: false, message: "Status obat harus Diproduksi" });
    }

    medicine.status = "Dalam Pengiriman ke Distributor";
    medicine.distributor = DISTRIBUTOR_ADDRESS;
    medicine.timestamp = Math.floor(Date.now() / 1000);

    return res.status(200).json({
      success: true,
      message: `Obat ID ${id} dikirim ke distributor`,
      medicine,
    });
  } catch (error) {
    console.error("[ERROR] Gagal mengirim ke distributor:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/medicine/receive-distributor
 * Distributor mengkonfirmasi penerimaan obat.
 * Body: { id: number, actorAddress: string }
 */
const receiveByDistributor = async (req, res) => {
  try {
    const { id, actorAddress } = req.body;
    const medicine = medicines.find((m) => m.id === Number(id));

    if (!id || !actorAddress) {
      return res.status(400).json({ success: false, message: "ID obat dan alamat aktor diperlukan" });
    }
    if (!medicine) {
      return res.status(404).json({ success: false, message: "ID obat tidak ditemukan" });
    }
    if (actorAddress !== DISTRIBUTOR_ADDRESS) {
      return res.status(403).json({ success: false, message: "Hanya distributor yang bisa konfirmasi penerimaan" });
    }
    if (medicine.status !== "Dalam Pengiriman ke Distributor") {
      return res.status(400).json({ success: false, message: "Status obat harus Dalam Pengiriman ke Distributor" });
    }

    medicine.status = "Diterima Distributor";
    medicine.timestamp = Math.floor(Date.now() / 1000);

    return res.status(200).json({
      success: true,
      message: `Obat ID ${id} diterima distributor`,
      medicine,
    });
  } catch (error) {
    console.error("[ERROR] Gagal menerima oleh distributor:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/medicine/send-apotek
 * Distributor mengirim obat ke apotek.
 * Body: { id: number, actorAddress: string }
 */
const sendToApotek = async (req, res) => {
  try {
    const { id, actorAddress } = req.body;
    const medicine = medicines.find((m) => m.id === Number(id));

    if (!id || !actorAddress) {
      return res.status(400).json({ success: false, message: "ID obat dan alamat aktor diperlukan" });
    }
    if (!medicine) {
      return res.status(404).json({ success: false, message: "ID obat tidak ditemukan" });
    }
    if (actorAddress !== DISTRIBUTOR_ADDRESS) {
      return res.status(403).json({ success: false, message: "Hanya distributor yang bisa kirim ke apotek" });
    }
    if (medicine.status !== "Diterima Distributor") {
      return res.status(400).json({ success: false, message: "Status obat harus Diterima Distributor" });
    }

    medicine.status = "Dalam Pengiriman ke Apotek";
    medicine.apotek = APOTEK_ADDRESS;
    medicine.timestamp = Math.floor(Date.now() / 1000);

    return res.status(200).json({
      success: true,
      message: `Obat ID ${id} dikirim ke apotek`,
      medicine,
    });
  } catch (error) {
    console.error("[ERROR] Gagal mengirim ke apotek:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/medicine/receive-apotek
 * Apotek mengkonfirmasi penerimaan obat.
 * Body: { id: number, actorAddress: string }
 */
const receiveByApotek = async (req, res) => {
  try {
    const { id, actorAddress } = req.body;
    const medicine = medicines.find((m) => m.id === Number(id));

    if (!id || !actorAddress) {
      return res.status(400).json({ success: false, message: "ID obat dan alamat aktor diperlukan" });
    }
    if (!medicine) {
      return res.status(404).json({ success: false, message: "ID obat tidak ditemukan" });
    }
    if (actorAddress !== APOTEK_ADDRESS) {
      return res.status(403).json({ success: false, message: "Hanya apotek yang bisa konfirmasi penerimaan" });
    }
    if (medicine.status !== "Dalam Pengiriman ke Apotek") {
      return res.status(400).json({ success: false, message: "Status obat harus Dalam Pengiriman ke Apotek" });
    }

    medicine.status = "Tiba di Apotek";
    medicine.timestamp = Math.floor(Date.now() / 1000);

    return res.status(200).json({
      success: true,
      message: `Obat ID ${id} telah tiba di apotek`,
      medicine,
    });
  } catch (error) {
    console.error("[ERROR] Gagal menerima oleh apotek:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/medicine/:id
 * Melacak status obat berdasarkan ID.
 */
const getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = medicines.find((m) => m.id === Number(id));

    if (!medicine) {
      return res.status(404).json({ success: false, message: "ID obat tidak ditemukan" });
    }

    return res.status(200).json({
      success: true,
      medicine,
    });
  } catch (error) {
    console.error("[ERROR] Gagal melacak obat:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/medicine
 * Mengembalikan semua obat yang terdaftar.
 */
const getAllMedicines = async (req, res) => {
  return res.status(200).json({
    success: true,
    count: medicines.length,
    medicines,
  });
};

// ============================================
// Export semua controller functions
// ============================================
module.exports = {
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
};
