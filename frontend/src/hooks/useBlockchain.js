/**
 * useBlockchain Hook
 *
 * Custom React hook untuk mengelola koneksi MetaMask,
 * membaca data smart contract HealthChain, dan
 * menentukan peran user (Produsen, Distributor, Apotek).
 */

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import HealthChainABI from '../contracts/HealthChainABI.json';

// Ganti dengan alamat smart contract yang sudah di-deploy di Sepolia
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

// Mapping status ke step index untuk timeline
const STATUS_TO_STEP = {
  'Diproduksi': 1,
  'Dalam Pengiriman ke Distributor': 2,
  'Diterima Distributor': 3,
  'Dalam Pengiriman ke Apotek': 4,
  'Tiba di Apotek': 5,
};

export default function useBlockchain() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [role, setRole] = useState(''); // 'produsen' | 'distributor' | 'apotek' | 'unknown'
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chainId, setChainId] = useState(null);

  // Alamat-alamat yang tersimpan di contract
  const [ownerAddress, setOwnerAddress] = useState('');
  const [distributorAddress, setDistributorAddress] = useState('');
  const [apotekAddress, setApotekAddress] = useState('');

  /**
   * Koneksi ke MetaMask dan inisialisasi contract
   */
  const connectWallet = useCallback(async () => {
    setError('');
    if (!window.ethereum) {
      setError('MetaMask tidak terdeteksi! Silakan install MetaMask terlebih dahulu.');
      return;
    }

    if (!CONTRACT_ADDRESS) {
      setError('CONTRACT_ADDRESS belum diatur. Tambahkan VITE_CONTRACT_ADDRESS di file .env frontend.');
      return;
    }

    try {
      setLoading(true);

      // Request akses akun MetaMask
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const currentAccount = accounts[0].toLowerCase();

      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await web3Provider.getNetwork();
      const web3Signer = web3Provider.getSigner();
      const healthContract = new ethers.Contract(CONTRACT_ADDRESS, HealthChainABI, web3Signer);

      setChainId(network.chainId);

      setProvider(web3Provider);
      setSigner(web3Signer);
      setContract(healthContract);
      setAccount(currentAccount);

      // Baca alamat-alamat peran dari smart contract
      const owner = (await healthContract.owner()).toLowerCase();
      const distributor = (await healthContract.alamatDistributor()).toLowerCase();
      const apotek = (await healthContract.alamatApotek()).toLowerCase();

      setOwnerAddress(owner);
      setDistributorAddress(distributor);
      setApotekAddress(apotek);

      // Tentukan peran berdasarkan alamat wallet yang terhubung
      if (currentAccount === owner) {
        setRole('produsen');
      } else if (currentAccount === distributor) {
        setRole('distributor');
      } else if (currentAccount === apotek) {
        setRole('apotek');
      } else {
        setRole('unknown');
      }

      setIsConnected(true);
    } catch (err) {
      console.error('Gagal connect wallet:', err);
      setError(err.message || 'Gagal menghubungkan wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Listen event perubahan akun di MetaMask
   */
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setIsConnected(false);
          setAccount('');
          setRole('');
        } else {
          // Reconnect dengan akun baru
          connectWallet();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [connectWallet]);

  // ============================================
  // Smart Contract Functions
  // ============================================

  /**
   * Produsen: Daftarkan obat baru
   */
  const produksiObat = async (namaObat) => {
    if (!contract) throw new Error('Contract belum terhubung');
    const tx = await contract.produksiObat(namaObat);
    await tx.wait();
    return tx;
  };

  /**
   * Produsen: Kirim obat ke distributor
   */
  const kirimKeDistributor = async (medicineId) => {
    if (!contract) throw new Error('Contract belum terhubung');
    const tx = await contract.kirimKeDistributor(medicineId);
    await tx.wait();
    return tx;
  };

  /**
   * Distributor: Konfirmasi penerimaan obat
   */
  const terimaOlehDistributor = async (medicineId) => {
    if (!contract) throw new Error('Contract belum terhubung');
    const tx = await contract.terimaOlehDistributor(medicineId);
    await tx.wait();
    return tx;
  };

  /**
   * Distributor: Kirim obat ke apotek
   */
  const kirimKeApotek = async (medicineId) => {
    if (!contract) throw new Error('Contract belum terhubung');
    const tx = await contract.kirimKeApotek(medicineId);
    await tx.wait();
    return tx;
  };

  /**
   * Apotek: Konfirmasi penerimaan obat
   */
  const terimaOlehApotek = async (medicineId) => {
    if (!contract) throw new Error('Contract belum terhubung');
    const tx = await contract.terimaOlehApotek(medicineId);
    await tx.wait();
    return tx;
  };

  /**
   * Publik: Lacak status obat berdasarkan ID
   */
  const lacakObat = async (medicineId) => {
    if (!contract) throw new Error('Contract belum terhubung');
    const result = await contract.lacakObat(medicineId);
    return {
      nama: result.nama,
      status: result.status,
      produsen: result.produsen,
      distributor: result.distributor,
      apotek: result.apotek,
      timestamp: new Date(result.timestamp.toNumber() * 1000).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
      }),
      step: STATUS_TO_STEP[result.status] || 0,
    };
  };

  /**
   * Publik: Ambil jumlah total obat
   */
  const getMedicineCount = async () => {
    if (!contract) throw new Error('Contract belum terhubung');
    const count = await contract.medicineCount();
    return count.toNumber();
  };

  return {
    // State
    account,
    role,
    isConnected,
    loading,
    error,
    chainId,
    contract,
    ownerAddress,
    distributorAddress,
    apotekAddress,

    // Actions
    connectWallet,
    produksiObat,
    kirimKeDistributor,
    terimaOlehDistributor,
    kirimKeApotek,
    terimaOlehApotek,
    lacakObat,
    getMedicineCount,
  };
}
