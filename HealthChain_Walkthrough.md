# HealthChain: Panduan Pembelajaran & Arsitektur Project

Dokumen ini merangkum seluruh tahapan, arsitektur, dan alur kerja yang telah kita kerjakan untuk membangun aplikasi pelacakan rantai pasok obat terdesentralisasi (Track & Trace Supply Chain) berbasis Blockchain. Anda dapat menggunakan dokumen ini sebagai bahan belajar dan referensi.

---

## 1. Arsitektur Smart Contract (`HealthChain.sol`)

Smart contract adalah inti dari aplikasi ini. Ia bertindak sebagai "database" dan "aturan bisnis" yang tidak bisa diubah (immutable).

### Konsep Utama
- **Role-Based Access Control (RBAC):** Akses dibagi berdasarkan peran.
  - `owner` (Produsen): Memiliki hak eksklusif untuk mendaftarkan obat baru dan mengirimnya pertama kali.
  - `alamatDistributor`: Hanya bisa menerima dari pabrik dan mengirim ke apotek.
  - `alamatApotek`: Hanya titik tujuan akhir (menerima obat).
- **Mapping & Struct:** Data setiap obat disimpan dalam `struct Medicine` yang mencatat ID, nama, status terkini, *timestamp*, dan alamat pihak yang menangani di setiap fase.
- **Validasi State (Require):** Transaksi hanya bisa berhasil jika status obat sesuai dengan alurnya. Contoh: Distributor tidak bisa menerima obat jika statusnya belum *"Dalam Pengiriman ke Distributor"*.

### Alur Deploy (Remix IDE)
Saat *deploy* kontrak ke jaringan Sepolia, alamat dompet (MetaMask) yang melakukan *deploy* otomatis di-set sebagai `owner` (Produsen). Pada saat yang sama, kita harus menyuntikkan (memasukkan) alamat akun MetaMask untuk Distributor dan Apotek ke dalam parameter *constructor*.

---

## 2. Integrasi Frontend (React + Vite)

Frontend dibangun agar pengguna tidak perlu berinteraksi dengan kode *smart contract* yang rumit secara langsung, melainkan menggunakan antarmuka grafis (UI).

### Refactoring yang Kita Lakukan
1. **Pembuatan Custom Hook (`useBlockchain.js`)**
   - **Enkapsulasi:** Kita memisahkan semua logika yang berhubungan dengan Blockchain (inisialisasi `ethers.js`, koneksi MetaMask, dan pemanggilan *method* dari *smart contract*) ke dalam satu *hook* khusus. Ini membuat file `App.jsx` menjadi sangat bersih.
   - **Deteksi Peran Otomatis:** Alih-alih mengecek dari database tradisional, *hook* kita memanggil fungsi `owner()`, `alamatDistributor()`, dan `alamatApotek()` langsung dari *smart contract*, lalu membandingkannya dengan alamat dompet (`account`) pengguna yang sedang aktif di MetaMask.
   - **Keamanan Jaringan:** Kita menambahkan deteksi `chainId`. Jika pengguna tidak berada di jaringan Sepolia (`11155111`), sistem akan memunculkan peringatan *"Wrong Network"*.

2. **Penyempurnaan State Management (`App.jsx`)**
   - Mengatasi *"stale state"* (data usang) dengan memastikan fungsi `tx.wait()` selesai dieksekusi di dalam *hook* sebelum kita memanggil ulang `loadContractMedicines()`. Hal ini menjamin bahwa tabel dan informasi status obat yang ditampilkan oleh UI sudah benar-benar ter-*update* dengan blok terbaru di blockchain.

---

## 3. Konfigurasi Backend (Node.js + Express)

Meskipun logika utama dan penyimpanan data (obat) berada langsung di *smart contract*, backend tetap dipertahankan dengan fungsi khusus.

### Mengapa Masih Butuh Backend?
- **Indexing & History:** Mengambil riwayat transaksi secara langsung dari Blockchain (Node biasa) bisa sangat lambat dan kompleks. Backend kita menggunakan **Etherscan API** (`/api/transactions/simple`) untuk mengambil *log* transaksi secara terstruktur.
- **Environment Management:** Menyimpan kunci rahasia seperti `ETHERSCAN_API_KEY` agar tidak terekspos ke sisi klien (frontend).

*(Catatan: Fitur data obat di backend pada awalnya bersifat mock/in-memory, namun pada iterasi yang kita lakukan, kita membuat frontend langsung membaca dari blockchain, menjadikannya sistem terdesentralisasi sejati).*

---

## 4. Ekosistem MetaMask & Jaringan Sepolia

Untuk berinteraksi dengan Web3, kita tidak menggunakan sistem otentikasi konvensional (Email/Password), melainkan Kriptografi Asimetris melalui Dompet Digital (MetaMask).

### Tahapan yang Kita Lalui:
1. **Sepolia Testnet:** Karena mendeploy ke *Mainnet* Ethereum menggunakan uang asli (ETH), kita menggunakan Sepolia, lingkungan pengujian (*Testnet*) yang meniru *Mainnet* 1:1, namun *gas fee*-nya dibayar dengan Sepolia ETH (koin simulasi gratis dari *Faucet*).
2. **Manajemen Identitas (Multiple Accounts):** Anda membuat 3 akun berbeda di MetaMask. Setiap akun merepresentasikan entitas perusahaan yang berbeda (Pabrik, Distributor, Apotek) dengan alamat (`0x...`) masing-masing.
3. **Penandatanganan Transaksi (Signing):** Setiap kali Produsen atau Distributor mengubah status obat (membuat data baru di blockchain), MetaMask muncul untuk meminta persetujuan pembayaran *gas fee*. Ini menjamin bahwa tidak ada status obat yang bisa diubah secara sepihak tanpa *Digital Signature* yang sah.

---

## Kesimpulan Alur Kerja Keseluruhan
1. **Developer:** Menulis kode Solidity -> Melakukan kompilasi -> Mendapatkan ABI -> Melakukan Deploy ke Sepolia -> Mendapatkan *Contract Address*.
2. **Setup Aplikasi:** Mengcopy *Contract Address* ke `frontend/.env` dan backend `.env`.
3. **Pengguna Akhir (UI):** Membuka Web -> *Connect* Wallet -> Web mengecek *Role* -> Pengguna menekan tombol "Aksi" -> Aplikasi memanggil *Smart Contract* menggunakan library `ethers.js` -> Transaksi di-broadcast ke jaringan Ethereum -> Status obat di-*update* secara publik & permanen!
