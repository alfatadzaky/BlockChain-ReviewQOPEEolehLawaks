## Status Proyek

Seluruh kode pada proyek **HealthChain** sudah berjalan dengan baik sesuai alur yang dirancang. Backend dapat berjalan sebagai server API, frontend dapat terhubung ke smart contract melalui MetaMask, dan proses pelacakan rantai pasok obat sudah mengikuti tahapan yang sesuai.

Alur utama aplikasi sudah sesuai, yaitu:

1. Produsen mendaftarkan atau memproduksi obat.
2. Produsen mengirim obat ke distributor.
3. Distributor mengonfirmasi penerimaan obat.
4. Distributor mengirim obat ke apotek.
5. Apotek mengonfirmasi obat sudah tiba.
6. Pengguna dapat melacak status obat melalui dashboard.

Dengan konfigurasi contract address yang sesuai antara backend dan frontend, aplikasi dapat membaca data dari smart contract HealthChain di jaringan Sepolia dan menampilkan role pengguna berdasarkan alamat wallet yang terhubung.
