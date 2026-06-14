# Panduan Instalasi & Persyaratan Proyek HealthChain (Blockchain Supply Chain)

Dokumen ini berisi panduan lengkap bagi kelompok lain atau penguji untuk menjalankan proyek **HealthChain (Sistem Pelacakan Rantai Pasok Obat Berbasis Blockchain)** di komputer lokal.

---

## 📋 Persyaratan Sistem (Requirements)

Sebelum menjalankan proyek ini, pastikan komputer/laptop Anda telah menginstal beberapa perangkat lunak berikut:

1. **Node.js**: Versi 16.x atau yang lebih baru (disarankan menggunakan versi LTS terbaru). Anda bisa mengunduhnya di [nodejs.org](https://nodejs.org/).
2. **Git**: Untuk mengelola repositori (opsional jika Anda mengunduh proyek dalam bentuk .zip).
3. **Web Browser**: Google Chrome, Mozilla Firefox, atau browser modern lainnya.
4. **Ekstensi Browser MetaMask**: 
   - Diperlukan untuk berinteraksi dengan smart contract di jaringan blockchain. 
   - Instal dari [metamask.io](https://metamask.io/).
5. **Jaringan Sepolia Testnet & Saldo ETH**:
   - MetaMask harus terhubung ke jaringan **Sepolia Testnet**.
   - Anda membutuhkan sedikit **Sepolia ETH** untuk membayar biaya transaksi (gas fee). Anda dapat meminta koin gratis dari [Sepolia Faucet](https://sepoliafaucet.com/).

---

## 🚀 Cara Instalasi & Menjalankan Proyek

Proyek ini terbagi menjadi dua bagian: **Backend (Server)** dan **Frontend (Antarmuka Web)**. Keduanya harus dijalankan agar aplikasi dapat berfungsi secara utuh.

### Langkah 1: Persiapan Folder Proyek
1. Buka/ekstrak folder proyek ini (`BlockChain`) di komputer Anda.
2. Buka **Terminal** atau **Command Prompt** (disarankan menggunakan terminal bawaan VS Code jika Anda membukanya melalui VS Code).

---

### Langkah 2: Menjalankan Backend (Server)

Backend berfungsi untuk menjembatani beberapa fungsi API (seperti Etherscan) dan melayani server backend lokal.

1. Buka terminal dan pastikan Anda berada di direktori utama (root) proyek:
   ```bash
   cd path/to/BlockChain
   ```
2. Instal semua dependensi backend:
   ```bash
   npm install
   ```
3. Konfigurasi file **`.env`**:
   - Pastikan terdapat file bernama `.env` di folder root ini.
   - Jika tidak ada, buat file baru bernama `.env` dan isi dengan konfigurasi berikut:
     ```env
     PORT=3099
     ETHERSCAN_API_KEY=FUA6Q8DV94N9GFYCBSTYUY9U9F7BMJDSXW
     CONTRACT_ADDRESS=0xE5B856d206B222D9150b7fc3234b8812f98B93AB
     ETHERSCAN_BASE_URL=https://api-sepolia.etherscan.io/api
     PRODUSEN_ADDRESS=0xcd2bc59f2cecbb81df45ab0a767b9aaf75fed37b
     DISTRIBUTOR_ADDRESS=0xDistributorAddressHere
     APOTEK_ADDRESS=0xApotekAddressHere
     ```
4. Jalankan server backend:
   ```bash
   npm start
   ```
   *(Server akan berjalan di http://localhost:3099)*

---

### Langkah 3: Menjalankan Frontend (Aplikasi Web)

Frontend adalah antarmuka yang akan digunakan langsung oleh pengguna. Anda perlu membuka **Terminal Baru** untuk menjalankan frontend agar terminal backend tetap berjalan.

1. Pada terminal baru, masuk ke direktori `frontend`:
   ```bash
   cd frontend
   ```
2. Instal semua dependensi frontend:
   ```bash
   npm install
   ```
3. Konfigurasi file **`.env`** untuk frontend:
   - Pastikan terdapat file bernama `.env` di dalam folder `frontend`.
   - Jika belum ada, buat file `.env` di dalam folder `frontend` dan isi dengan:
     ```env
     VITE_CONTRACT_ADDRESS=0xE5B856d206B222D9150b7fc3234b8812f98B93AB
     ```
4. Jalankan aplikasi web:
   ```bash
   npm start
   ```
   *(Aplikasi akan berjalan secara default di http://localhost:5173)*

---

## 💻 Cara Mengakses & Menggunakan Aplikasi

1. Buka browser Anda dan akses URL: **http://localhost:5173**
2. Pastikan ekstensi **MetaMask** di browser Anda dalam keadaan aktif (sudah login) dan menggunakan jaringan **Sepolia testnet**.
3. Saat aplikasi web pertama kali dibuka, akan ada prompt (pop-up) dari MetaMask yang meminta izin untuk menghubungkan dompet (wallet) ke situs web. Klik **Hubungkan (Connect)**.
4. Aplikasi kini siap digunakan! Anda bisa menguji fungsionalitas rantai pasok obat melalui antarmuka web, dan setiap transaksi yang memerlukan perubahan data di blockchain akan meminta konfirmasi tanda tangan (signature) melalui pop-up MetaMask.

---

## 🛠️ Ringkasan Perintah Cepat

Jika Anda sudah pernah melakukan `npm install` sebelumnya, cukup lakukan ini setiap kali ingin menjalankan proyek:

**Terminal 1 (Backend):**
```bash
# Di folder root BlockChain
npm start
```

**Terminal 2 (Frontend):**
```bash
# Di folder BlockChain/frontend
npm start
```
