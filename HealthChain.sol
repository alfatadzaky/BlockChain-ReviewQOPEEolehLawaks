// SELURUH KODE SUDAH BENAR DAN BERJALAN BAIK, ALUR JUGA SUDAH SESUAI

// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

contract HealthChain {

    address public owner; // ✓ Tepat untuk owner kontrak
    address public alamatDistributor; // ⚠ Pertimbangkan immutable atau constant, tidak perlu berubah
    address public alamatApotek; // ⚠ -- || -- 

    struct Medicine {
        uint id; // ✓ ID untuk identifikasi unik
        string nama; // ⚠ Perlu validasi input agar tidak kosong
        address produsen; // ✓ Mencatat siapa yang memproduksi
        address distributor; // ✓ Mencatat distributor yang menangani 
        address apotek; // ✓ Mencatat apotek tujuan akhir
        string status; // ⚠ Rawan typo dan kurang efisien, gunakan enum sebagai gantinya
        uint timestamp; // ✓ Audit trail untuk tracking waktu
    }

    mapping(uint => Medicine) public medicines; // ✓ Struktur penyimpanan sudah tepat
    uint public medicineCount = 0; // ✓ Counter untuk tracking jumlah obat

    constructor(address _distributor, address _apotek) {
        owner = msg.sender; // ✓ Owner adalah deployer
        alamatDistributor = _distributor; // ⚠ Sebaiknya validasi address bukan address(0)
        alamatApotek = _apotek; // ⚠ Sebaiknya validasi address bukan address(0)
        // ⚠ Belum ada event, tambahkan untuk audit trail
    }

    function produksiObat(string memory _nama) public { // ✓ Public sudah tepat
        require(msg.sender == owner, "Hanya produsen yang bisa mendaftarkan obat"); // ✓ Access control tepat
        // ⚠ Tambahkan validasi: require(bytes(_nama).length > 0, "Nama tidak boleh kosong")
        medicineCount++; // ✓ Increment counter
        medicines[medicineCount] = Medicine(
            medicineCount, // ✓ ID unik
            _nama,
            msg.sender, // ✓ Otomatis catat address produsen
            address(0), // ✓ Distributor belum ada
            address(0), // ✓ Apotek belum ada
            "Diproduksi", // ⚠ String status rawan typo, gunakan enum
            block.timestamp // ✓ Timestamp otomatis untuk audit
        );
        // ⚠ Belum ada event, tambahkan: emit MedicineProduced(medicineCount, _nama, msg.sender)
    }

    function kirimKeDistributor(uint _id) public {
        require(msg.sender == owner, "Hanya produsen yang bisa mengirim ke distributor"); // ✓ Access control tepat
        require(medicines[_id].id != 0, "ID obat tidak ditemukan"); // ✓ Validasi obat ada
        require(
            keccak256(bytes(medicines[_id].status)) == keccak256(bytes("Diproduksi")),
            "Status obat harus Diproduksi"
        ); // ⚠ Perbandingan string dengan keccak256 sangat kurang efisien, gunakan enum
        medicines[_id].status = "Dalam Pengiriman ke Distributor"; // ❌ String status kurang efisien
        medicines[_id].distributor = alamatDistributor; // ✓ Catat distributor
        medicines[_id].timestamp = block.timestamp; // ✓ Update timestamp
        // ⚠ Belum ada event, tambahkan untuk tracking
    }

    function terimaOlehDistributor(uint _id) public {
        require(msg.sender == alamatDistributor, "Hanya distributor yang bisa konfirmasi"); // ✓ Access control tepat
        require(medicines[_id].id != 0, "ID obat tidak ditemukan"); // ✓ Validasi obat ada
        require(
            keccak256(bytes(medicines[_id].status)) == keccak256(bytes("Dalam Pengiriman ke Distributor")),
            "Status obat tidak sesuai"
        ); // ⚠ Keccak256 kurang efisien, gunakan enum untuk status
        medicines[_id].status = "Diterima Distributor"; // ❌ String status
        medicines[_id].timestamp = block.timestamp; // ✓ Update timestamp
        // ⚠ Belum ada event
    }

    function kirimKeApotek(uint _id) public {
        require(msg.sender == alamatDistributor, "Hanya distributor yang bisa kirim ke apotek"); // ✓ Access control tepat
        require(medicines[_id].id != 0, "ID obat tidak ditemukan"); // ✓ Validasi obat ada
        require(
            keccak256(bytes(medicines[_id].status)) == keccak256(bytes("Diterima Distributor")),
            "Status obat harus Diterima Distributor"
        ); // ⚠ Keccak256 kurang efisien, gunakan enum
        medicines[_id].status = "Dalam Pengiriman ke Apotek"; // ❌ String status
        medicines[_id].apotek = alamatApotek; // ✓ Catat apotek tujuan
        medicines[_id].timestamp = block.timestamp; // ✓ Update timestamp
        // ⚠ Belum ada event
    }

    function terimaOlehApotek(uint _id) public {
        require(msg.sender == alamatApotek, "Hanya apotek yang bisa konfirmasi"); // ✓ Access control tepat
        require(medicines[_id].id != 0, "ID obat tidak ditemukan"); // ✓ Validasi obat ada
        require(
            keccak256(bytes(medicines[_id].status)) == keccak256(bytes("Dalam Pengiriman ke Apotek")),
            "Status obat tidak sesuai"
        ); // ⚠ Keccak256 kurang efisien, gunakan enum
        medicines[_id].status = "Tiba di Apotek"; // ❌ String status, tahap akhir seharusnya lebih detail
        medicines[_id].timestamp = block.timestamp; // ✓ Update timestamp
        // ⚠ Belum ada event, sangat penting untuk tahap akhir
    }

    function lacakObat(uint _id) public view returns (
        string memory nama,
        string memory status,
        address produsen,
        address distributor,
        address apotek,
        uint timestamp
    ) { // ✓ View function tepat untuk transparansi
        require(medicines[_id].id != 0, "ID obat tidak ditemukan"); // ✓ Validasi obat ada
        Medicine memory m = medicines[_id]; // ✓ Ambil data ke memory
        return (m.nama, m.status, m.produsen, m.distributor, m.apotek, m.timestamp); // ✓ Return semua informasi
        // 💡 Pertimbangkan return struct langsung daripada multiple values untuk scalability
    } 
}