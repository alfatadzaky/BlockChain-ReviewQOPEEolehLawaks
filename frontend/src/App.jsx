import { useState, useEffect, useCallback } from 'react';
import { Package, Truck, CheckCircle, Hospital, Search, RefreshCw, Activity, Shield, Store, Wallet, ExternalLink, Loader } from 'lucide-react';
import useBlockchain from './hooks/useBlockchain';
import './index.css';

const API_BASE = 'http://localhost:3099/api';
const SEPOLIA_SCAN = 'https://sepolia.etherscan.io';

const STATUS_STEPS = [
  { status: 'Diproduksi', label: 'Produksi Pabrik', icon: <Package size={20} /> },
  { status: 'Dalam Pengiriman ke Distributor', label: 'Kirim ke Distributor', icon: <Truck size={20} /> },
  { status: 'Diterima Distributor', label: 'Diterima Distributor', icon: <CheckCircle size={20} /> },
  { status: 'Dalam Pengiriman ke Apotek', label: 'Kirim ke Apotek', icon: <Hospital size={20} /> },
  { status: 'Tiba di Apotek', label: 'Tiba di Apotek', icon: <CheckCircle size={20} /> },
];

function App() {
  const {
    account,
    role: userRole,
    isConnected,
    loading: walletLoading,
    error: walletError,
    connectWallet,
    chainId,
    contract,
    produksiObat,
    kirimKeDistributor,
    terimaOlehDistributor,
    kirimKeApotek,
    terimaOlehApotek,
    lacakObat: lacakObatHook,
    getMedicineCount
  } = useBlockchain();

  // Data
  const [medicines, setMedicines] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [trackedMedicine, setTrackedMedicine] = useState(null);
  const [medicineId, setMedicineId] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [message, setMessage] = useState(null);

  // ============================================
  // Init: fetch transactions
  // ============================================
  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (contract) {
      loadContractMedicines();
    }
  }, [contract]);

  useEffect(() => {
    if (walletError) {
      showMessage(walletError, true);
    }
  }, [walletError]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/transactions/simple`);
      const data = await res.json();
      if (data.success) setTransactions(data.result);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ============================================
  // Contract reads
  // ============================================
  const loadContractMedicines = async () => {
    if (!contract) return;
    try {
      const count = await getMedicineCount();
      const items = [];
      for (let i = 1; i <= count; i++) {
        const m = await contract.medicines(i);
        items.push({
          id: Number(m.id),
          nama: m.nama,
          produsen: m.produsen,
          distributor: m.distributor,
          apotek: m.apotek,
          status: m.status,
          timestamp: Number(m.timestamp),
        });
      }
      setMedicines(items.reverse());
    } catch (e) { console.error('Load medicines error:', e); }
  };

  const trackOnChain = async () => {
    if (!contract || !medicineId) return;
    try {
      const m = await lacakObatHook(Number(medicineId));
      setTrackedMedicine({
        id: Number(medicineId),
        nama: m.nama,
        status: m.status,
        produsen: m.produsen,
        distributor: m.distributor,
        apotek: m.apotek,
        timestamp: m.timestamp, // string formatted in hook
      });
    } catch (e) {
      setTrackedMedicine(null);
      showMessage('Obat tidak ditemukan di blockchain', true);
    }
  };

  // Track by direct ID (for table row clicks to avoid stale state)
  const handleTrackById = async (id) => {
    if (!contract) return;
    try {
      const m = await lacakObatHook(Number(id));
      setTrackedMedicine({
        id: Number(id),
        nama: m.nama,
        status: m.status,
        produsen: m.produsen,
        distributor: m.distributor,
        apotek: m.apotek,
        timestamp: m.timestamp,
      });
    } catch (e) {
      setTrackedMedicine(null);
      showMessage('Obat tidak ditemukan di blockchain', true);
    }
  };

  // ============================================
  // Contract writes
  // ============================================
  const sendTx = async (action, label) => {
    if (!contract) { showMessage('Connect wallet dulu!', true); return; }
    setTxLoading(true);
    try {
      // action returns tx and already calls await tx.wait() in the hook
      const tx = await action();
      showMessage(`${label} berhasil! Tx: ${tx.hash.slice(0, 10)}...`);

      // Update UI
      await loadContractMedicines();
      if (trackedMedicine || medicineId) {
        handleTrackById(trackedMedicine?.id || medicineId);
      }
    } catch (e) {
      if (e.code === 'ACTION_REJECTED') showMessage('Transaksi dibatalkan', true);
      else showMessage('Gagal: ' + (e.reason || e.message), true);
    } finally {
      setTxLoading(false);
    }
  };

  const handleProduce = () => {
    if (!medicineName) { showMessage('Masukkan nama obat!', true); return; }
    sendTx(() => produksiObat(medicineName), 'Produksi Obat');
  };

  const handleSendDistributor = () => {
    if (!medicineId) { showMessage('Masukkan ID Obat!', true); return; }
    sendTx(() => kirimKeDistributor(Number(medicineId)), 'Kirim ke Distributor');
  };

  const handleReceiveDistributor = () => {
    if (!medicineId) { showMessage('Masukkan ID Obat!', true); return; }
    sendTx(() => terimaOlehDistributor(Number(medicineId)), 'Terima oleh Distributor');
  };

  const handleSendApotek = () => {
    if (!medicineId) { showMessage('Masukkan ID Obat!', true); return; }
    sendTx(() => kirimKeApotek(Number(medicineId)), 'Kirim ke Apotek');
  };

  const handleReceiveApotek = () => {
    if (!medicineId) { showMessage('Masukkan ID Obat!', true); return; }
    sendTx(() => terimaOlehApotek(Number(medicineId)), 'Terima oleh Apotek');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    trackOnChain();
  };

  // ============================================
  // UI helpers
  // ============================================
  const showMessage = (text, isError = false) => {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 5000);
  };

  const getStepIndex = (status) => {
    const idx = STATUS_STEPS.findIndex(s => s.status === status);
    return idx >= 0 ? idx + 1 : 0;
  };

  const truncate = (s, len = 6) => {
    if (!s || s === '0x0000000000000000000000000000000000000000') return '-';
    return `${s.slice(0, len)}...${s.slice(-4)}`;
  };

  const isSepolia = chainId === 11155111n || chainId === 11155111 || chainId === '0xaa36a7';
  const isProdusen = userRole === 'produsen';
  const isDistributor = userRole === 'distributor';
  const isApotek = userRole === 'apotek';

  return (
    <>
      <div className="bg-glow"></div>
      <div className="container">
        <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <Activity color="var(--primary)" size={40} />
            HealthChain <span style={{ color: 'var(--primary)' }}>Track & Trace</span>
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Dashboard Pelacakan Rantai Pasok Obat Terdesentralisasi</p>
        </header>

        {/* Wallet & Role Bar */}
        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Wallet size={20} color="var(--text-muted)" />
              {isConnected ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <code className="addr-code">{truncate(account, 8)}</code>
                  {!isSepolia && <span className="badge badge-warning">Wrong Network</span>}
                  {isSepolia && <span className="badge badge-success">Sepolia</span>}
                  <span className={`badge ${userRole === 'unknown' ? 'badge-warning' : 'badge-role'}`}>
                    {userRole === 'produsen' && <><Shield size={14} /> Produsen</>}
                    {userRole === 'distributor' && <><Truck size={14} /> Distributor</>}
                    {userRole === 'apotek' && <><Store size={14} /> Apoteker</>}
                    {userRole === 'unknown' && 'Pemantau'}
                  </span>
                  <a href={`${SEPOLIA_SCAN}/address/${account}`} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem' }}>
                    <ExternalLink size={14} />
                  </a>
                </div>
              ) : (
                <button onClick={connectWallet} className="btn btn-primary" disabled={walletLoading}>
                  {walletLoading ? <><Loader className="spinning" size={16} /> Connecting...</> : 'Connect Wallet'}
                </button>
              )}
            </div>
            <button onClick={fetchTransactions} className="btn btn-ghost" style={{ padding: '0.5rem 0.75rem' }}>
              <RefreshCw size={16} className={loading ? 'spinning' : ''} /> Segarkan Tx
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`message ${message.isError ? 'error' : ''}`}>
            {message.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* Control Panel */}
          <div className="glass-card">
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Kontrol Pelacakan</h2>

            {/* Search */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
              <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>ID Obat</label>
                <input type="text" className="input-field" placeholder="Contoh: 1" value={medicineId}
                  onChange={(e) => setMedicineId(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '45px' }} disabled={!contract}>
                <Search size={18} /> Lacak
              </button>
            </form>

            {/* Actions */}
            {isConnected && (
              <>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Tindakan — <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                    {userRole === 'produsen' ? 'Produsen' : userRole === 'distributor' ? 'Distributor' : userRole === 'apotek' ? 'Apoteker' : 'Pemantau (read-only)'}
                  </span>
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <button onClick={handleProduce} className={`btn ${isProdusen ? 'btn-primary' : 'btn-disabled'}`} disabled={!isProdusen || txLoading}>
                    <Package size={18} /> Produksi Obat
                  </button>
                  <button onClick={handleSendDistributor} className={`btn ${isProdusen ? 'btn-primary' : 'btn-disabled'}`} disabled={!isProdusen || txLoading}>
                    <Truck size={18} /> Kirim ke Distributor
                  </button>
                  <button onClick={handleReceiveDistributor} className={`btn ${isDistributor ? 'btn-success' : 'btn-disabled'}`} disabled={!isDistributor || txLoading}>
                    <CheckCircle size={18} /> Konfirmasi Penerimaan
                  </button>
                  <button onClick={handleSendApotek} className={`btn ${isDistributor ? 'btn-primary' : 'btn-disabled'}`} disabled={!isDistributor || txLoading}>
                    <Hospital size={18} /> Kirim ke Apotek
                  </button>
                  <button onClick={handleReceiveApotek} className={`btn ${isApotek ? 'btn-success' : 'btn-disabled'}`} disabled={!isApotek || txLoading}>
                    <CheckCircle size={18} /> Konfirmasi Tiba di Apotek
                  </button>
                </div>
              </>
            )}

            {isConnected && isProdusen && (
              <div className="input-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
                <label>Nama Obat (untuk produksi)</label>
                <input type="text" className="input-field" placeholder="Contoh: Paracetamol 500mg"
                  value={medicineName} onChange={(e) => setMedicineName(e.target.value)} />
              </div>
            )}
          </div>

          {/* Tracked Medicine */}
          {trackedMedicine && (
            <div className="glass-card">
              <h2 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>
                Status Obat: <span style={{ color: 'var(--primary)' }}>{trackedMedicine.nama}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>(ID: {trackedMedicine.id})</span>
              </h2>
              <div className="timeline">
                {STATUS_STEPS.map((step, index) => (
                  <div key={step.status} className={`timeline-item ${getStepIndex(trackedMedicine.status) > index ? 'active' : ''}`}>
                    <div className={`timeline-dot ${getStepIndex(trackedMedicine.status) > index ? 'active' : ''}`}>
                      {step.icon}
                    </div>
                    <div className="timeline-label">{step.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> <span className="status-badge">{trackedMedicine.status}</span></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Produsen:</span> <code className="addr-code">{truncate(trackedMedicine.produsen)}</code></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Distributor:</span> <code className="addr-code">{truncate(trackedMedicine.distributor)}</code></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Apotek:</span> <code className="addr-code">{truncate(trackedMedicine.apotek)}</code></div>
              </div>
            </div>
          )}
        </div>

        {/* Medicine List from Blockchain */}
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Daftar Obat (Blockchain)</h2>
            {contract && (
              <button onClick={() => loadContractMedicines()} className="btn btn-ghost" style={{ padding: '0.5rem 0.75rem' }}>
                <RefreshCw size={16} /> Muat Ulang
              </button>
            )}
          </div>
          <div className="table-wrapper">
            {medicines.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nama</th>
                    <th>Status</th>
                    <th>Produsen</th>
                    <th>Distributor</th>
                    <th>Apotek</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((m) => (
                    <tr key={m.id} onClick={() => { setMedicineId(String(m.id)); handleTrackById(m.id); }} style={{ cursor: 'pointer' }}>
                      <td>{m.id}</td>
                      <td>{m.nama}</td>
                      <td><span className="status-badge">{m.status}</span></td>
                      <td><code className="addr-code">{truncate(m.produsen)}</code></td>
                      <td><code className="addr-code">{truncate(m.distributor)}</code></td>
                      <td><code className="addr-code">{truncate(m.apotek)}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                {contract ? 'Belum ada obat di blockchain.' : 'Connect wallet untuk melihat data.'}
              </p>
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Riwayat Transaksi Blockchain</h2>
            <button onClick={fetchTransactions} className="btn btn-ghost" style={{ padding: '0.5rem 0.75rem' }}>
              <RefreshCw size={16} className={loading ? 'spinning' : ''} /> Segarkan
            </button>
          </div>
          <div className="table-wrapper">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <RefreshCw className="spinning" size={32} style={{ margin: '0 auto 1rem auto', display: 'block' }} />
                Memuat data dari Sepolia Testnet...
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Waktu (WIB)</th>
                    <th>Tx Hash</th>
                    <th>Pengirim</th>
                    <th>Penerima</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length > 0 ? transactions.map((tx, idx) => (
                    <tr key={idx}>
                      <td>{tx.timestamp}</td>
                      <td>
                        <a href={`${SEPOLIA_SCAN}/tx/${tx.hash}`} target="_blank" rel="noreferrer" className="hash-text" title={tx.hash}>
                          {tx.hash}
                        </a>
                      </td>
                      <td><span className="hash-text" title={tx.from}>{tx.from}</span></td>
                      <td><span className="hash-text" title={tx.to}>{tx.to}</span></td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Tidak ada data transaksi.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {txLoading && (
          <div className="tx-overlay">
            <div className="tx-modal">
              <Loader className="spinning" size={40} color="var(--primary)" />
              <p>Memproses transaksi di Sepolia...</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Konfirmasi di MetaMask</p>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .addr-code { font-family: monospace; font-size: 0.8rem; color: var(--primary); }
        .btn-ghost { background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: var(--text-muted); cursor: pointer; border-radius: 8px; }
        .btn-ghost:hover { background: rgba(255,255,255,0.1); color: var(--text-main); }
        .btn-disabled { background: rgba(255,255,255,0.08) !important; cursor: not-allowed !important; opacity: 0.5; }
        .btn-disabled:hover { box-shadow: none !important; }
        .badge { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
        .badge-success { background: rgba(16,185,129,0.15); color: var(--success); border: 1px solid rgba(16,185,129,0.3); }
        .badge-warning { background: rgba(245,158,11,0.15); color: var(--warning); border: 1px solid rgba(245,158,11,0.3); }
        .badge-role { background: rgba(59,130,246,0.15); color: var(--primary); border: 1px solid rgba(59,130,246,0.3); }
        .message { padding: 0.75rem 1rem; border-radius: 8px; background: rgba(16,185,129,0.15); color: var(--success); border: 1px solid rgba(16,185,129,0.3); margin-bottom: 1rem; text-align: center; font-weight: 500; font-size: 0.9rem; }
        .message.error { background: rgba(239,68,68,0.15); color: #ef4444; border-color: rgba(239,68,68,0.3); }
        .tx-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(4px); }
        .tx-modal { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; padding: 2.5rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
        tr.clickable { cursor: pointer; }
        tr:hover td { background: rgba(255,255,255,0.03); }
      `}} />
    </>
  )
}

export default App