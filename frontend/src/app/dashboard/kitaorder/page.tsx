'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  WhatsappLogo, 
  Package, 
  Lightning, 
  Wrench, 
  QrCode, 
  Plus, 
  PencilSimple, 
  Trash, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ChatText, 
  Copy, 
  ArrowsClockwise, 
  DeviceMobile, 
  ShoppingBag, 
  MagnifyingGlass,
  ArrowSquareOut,
  X,
  UsersThree,
  CircleNotch,
  PaperPlaneRight,
  Tag,
  Sparkle,
  UploadSimple,
  WarningCircle,
  ShieldCheck,
  Image as ImageIcon
} from '@phosphor-icons/react';
import { QRCodeSVG } from 'qrcode.react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/components/ToastProvider';
import { useConfirm } from '@/components/ConfirmModalProvider';
import { API_BASE_URL, BOT_API_BASE_URL } from '@/lib/api';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

export interface BotProduct {
  id?: string;
  merchant_id?: string;
  code: string;
  name: string;
  description: string;
  price: number;
  type: 'digital' | 'physical' | 'service';
  stock: number;
  digital_payload?: string | null;
  image_url?: string | null;
  is_active?: boolean;
}

export interface BotSessionStatus {
  merchantId: string;
  status: 'CONNECTED' | 'PAIRING' | 'CONNECTING' | 'DISCONNECTED';
  phoneNumber: string | null;
  ownerPhone: string | null;
  qr: string | null;
  pairingCode: string | null;
  botName: string;
  greetingMessage: string;
}

export interface BotOrder {
  id: string;
  invoice_code: string;
  customer_phone: string;
  customer_name: string | null;
  shipping_address: string | null;
  order_notes: string | null;
  items: Array<{
    code: string;
    name: string;
    price: number;
    qty: number;
    type: string;
    subtotal: number;
  }>;
  total_amount: number;
  status: 'UNPAID' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  payment_method: string;
  digital_delivered?: boolean;
  created_at: string;
}

export interface BotGroup {
  id: string;
  name: string;
  description?: string;
  participantCount: number;
  isWhitelisted: boolean;
  creationTime?: string | null;
}

export default function KitaOrderPage() {
  const { user } = useAuth();
  const toast = useToast();
  const modal = useConfirm();

  // Primary merchant ID
  const merchantId = user?.id || '1a191778-415b-41e8-a532-b71ba0ce909b';

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'katalog' | 'promosi' | 'koneksi' | 'pesanan'>('katalog');

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Promo & Broadcast State (Uploaded Poster via Cloudinary & Custom Caption)
  const [posterUrl, setPosterUrl] = useState<string>('');
  const [posterBase64, setPosterBase64] = useState<string>('');
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [captionText, setCaptionText] = useState<string>('');
  const [selectedProductCode, setSelectedProductCode] = useState<string>('');
  const [targetStatus, setTargetStatus] = useState(true);
  const [targetGroups, setTargetGroups] = useState(true);
  const [promoTargetGroupJids, setPromoTargetGroupJids] = useState<string[]>([]);
  const [promoGroupSearch, setPromoGroupSearch] = useState<string>('');
  const [publishingPromo, setPublishingPromo] = useState(false);
  const [promoHistory, setPromoHistory] = useState<any[]>([]);
  const [loadingPromoHistory, setLoadingPromoHistory] = useState(false);
  const [promoContactsCount, setPromoContactsCount] = useState<number>(0);

  // Bot Session State
  const [session, setSession] = useState<BotSessionStatus | null>(null);
  const [connectMode, setConnectMode] = useState<'qr' | 'pairing'>('qr');
  const [pairingPhoneInput, setPairingPhoneInput] = useState('');
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Group Whitelist State
  const [groups, setGroups] = useState<BotGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [togglingGroupId, setTogglingGroupId] = useState<string | null>(null);
  const [searchGroup, setSearchGroup] = useState('');

  // Settings State (Owner Phone & Bot Profile)
  const [ownerPhoneInput, setOwnerPhoneInput] = useState('');
  const [botNameInput, setBotNameInput] = useState('KitaOrder');
  const [greetingInput, setGreetingInput] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Products State
  const [products, setProducts] = useState<BotProduct[]>([]);
  const [productFilter, setProductFilter] = useState<'all' | 'digital' | 'physical' | 'service'>('all');
  const [searchProduct, setSearchProduct] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BotProduct | null>(null);
  const [productForm, setProductForm] = useState<BotProduct>({
    code: '',
    name: '',
    description: '',
    price: 10000,
    type: 'digital',
    stock: 10,
    digital_payload: '',
  });
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<BotOrder[]>([]);
  const [searchOrder, setSearchOrder] = useState('');
  const [orderFilter, setOrderFilter] = useState<'all' | 'PAID' | 'UNPAID'>('all');

  // Webhook Simulator State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [customInvoiceInput, setCustomInvoiceInput] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [quickSimulatingId, setQuickSimulatingId] = useState<string | null>(null);

  // Run Webhook Simulation
  const handleRunSimulation = async (targetInvoice?: string) => {
    const invoiceToSimulate = (targetInvoice || selectedInvoice || customInvoiceInput).trim().toUpperCase();
    if (!invoiceToSimulate) {
      toast.error('Pilih atau masukkan kode Invoice yang ingin disimulasikan');
      return;
    }

    if (targetInvoice) {
      setQuickSimulatingId(targetInvoice);
    } else {
      setIsSimulating(true);
      setSimulationResult(null);
    }

    try {
      const res = await fetch(`${BOT_API_BASE_URL}/webhook/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceCode: invoiceToSimulate,
          merchantId,
        }),
      });

      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(
          res.status === 413
            ? 'Ukuran poster terlalu besar (maksimal 50MB).'
            : res.status === 502 || res.status === 503
            ? 'Layanan bot WhatsApp sedang offline. Silakan coba sesaat lagi.'
            : `Respon server bot tidak valid (HTTP ${res.status}).`
        );
      }

      if (res.ok && json.success) {
        toast.success(`Pembayaran ${invoiceToSimulate} berhasil disimulasikan LUNAS!`);
        setSimulationResult(json);
        await Promise.allSettled([fetchOrders(), fetchProducts()]);
      } else {
        toast.error(json.error || 'Simulasi gagal');
        setSimulationResult({ error: json.error || 'Gagal memproses simulasi' });
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat memproses simulasi');
      setSimulationResult({ error: err.message || 'Network error' });
    } finally {
      setIsSimulating(false);
      setQuickSimulatingId(null);
    }
  };

  // Fetch session status
  const fetchSessionStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BOT_API_BASE_URL}/session/status/${merchantId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSession(json.data);
          if (json.data.ownerPhone) {
            setOwnerPhoneInput(json.data.ownerPhone);
          }
          if (json.data.botName) setBotNameInput(json.data.botName);
          if (json.data.greetingMessage) setGreetingInput(json.data.greetingMessage);
        }
      }
    } catch (err) {
      console.warn('Bot session status service unreachable:', err);
    }
  }, [merchantId]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${BOT_API_BASE_URL}/products/${merchantId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setProducts(json.data);
          if (json.data.length > 0) {
            setSelectedProductCode(prev => prev || json.data[0].code);
          }
        }
      }
    } catch (err) {
      console.warn('Bot products service unreachable:', err);
    }
  }, [merchantId]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${BOT_API_BASE_URL}/orders/${merchantId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setOrders(json.data);
        }
      }
    } catch (err) {
      console.warn('Bot orders service unreachable:', err);
    }
  }, [merchantId]);

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    if (!merchantId) return;
    setLoadingGroups(true);
    try {
      const res = await fetch(`${BOT_API_BASE_URL}/groups/${merchantId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setGroups(json.data);
          // Jika belum ada grup yang dipilih, pilih grup whitelist sebagai default
          setPromoTargetGroupJids((prev) => {
            if (prev.length > 0) return prev;
            const whitelisted = json.data.filter((g: any) => g.isWhitelisted).map((g: any) => g.id);
            return whitelisted;
          });
        }
      }
    } catch (e) {
      console.warn('Gagal fetch daftar grup bot:', e);
    } finally {
      setLoadingGroups(false);
    }
  }, [merchantId]);

  // Toggle Group Whitelist
  const handleToggleGroup = async (group: BotGroup) => {
    setTogglingGroupId(group.id);
    const newStatus = !group.isWhitelisted;
    try {
      const res = await fetch(`${BOT_API_BASE_URL}/groups/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          groupJid: group.id,
          enabled: newStatus,
          groupName: group.name
        })
      });
      if (res.ok) {
        const json = await res.json();
        toast.success(json.message || `Grup ${group.name} berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
        setGroups(prev => prev.map(g => g.id === group.id ? { ...g, isWhitelisted: newStatus } : g));
      } else {
        toast.error('Gagal memperbarui izin grup');
      }
    } catch (e: any) {
      toast.error(e.message || 'Gagal mengubah status grup');
    } finally {
      setTogglingGroupId(null);
    }
  };

  // Promo: Upload Poster Image to Cloudinary (same Cloudinary as KitaPay project)
  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran poster maksimal 10MB');
      return;
    }

    // Baca base64 lokal untuk penyiaran instan tanpa lag
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setPosterBase64(ev.target.result);
      }
    };
    reader.readAsDataURL(file);

    setIsUploadingPoster(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'kitapay_promosi');

      const res = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.secure_url) {
        setPosterUrl(json.secure_url);
        toast.success('Poster iklan berhasil diunggah ke Cloudinary!');
      } else {
        toast.error(json.error || json.details || 'Gagal mengunggah poster ke Cloudinary');
      }
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      toast.error(`Gagal upload poster: ${err.message}`);
    } finally {
      setIsUploadingPoster(false);
      e.target.value = '';
    }
  };

  // Promo: Insert Product Info Template
  const handleInsertProductInfo = (code: string) => {
    const prod = products.find(p => p.code === code);
    if (!prod) return;

    setSelectedProductCode(code);
    const formattedPrice = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(prod.price);

    const template = `🔥 *RESTOCK: ${prod.name.toUpperCase()}*\n` +
                     `HARGANYA CUMAN ${formattedPrice}!!\n` +
                     `Stok: ${prod.stock} Tersedia\n\n` +
                     `👉 *Cara Pembelian:*\n` +
                     `Balas di chat ini: ketik *!beli ${prod.code}*\n` +
                     `Atau hubungi bot toko untuk order instan.`;

    if (!captionText) {
      setCaptionText(template);
    } else {
      setCaptionText(prev => prev + '\n\n' + template);
    }
    toast.success(`Format info ${prod.name} dimasukkan ke teks.`);
  };

  // Promo: Auto-Restore & Auto-Persist Promo Draft to LocalStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('kitapay_promo_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.posterUrl) setPosterUrl(parsed.posterUrl);
        if (parsed.captionText) setCaptionText(parsed.captionText);
        if (parsed.selectedProductCode) setSelectedProductCode(parsed.selectedProductCode);
        return;
      }
    } catch {}

    // Inisialisasi default dengan materi promosi & poster terakhir
    setPosterUrl('https://res.cloudinary.com/djkkckmig/image/upload/v1794009286/kitapay_promosi/klhdpydwf7justsgx0e6.png');
    setCaptionText(
      `TRANSAKSI GA RIBET LAGI PAKE KITAPAY !\nJADI MERCHANT SEKARANG,\n\nkitapay.rinzgroup.web.id\n\n✔ Bisa Sambung ke Bot & Web: Cocok buat toko otomatis 24 jam (Bot Auto-Order, Website, Marketplace).\n✔ Pencairan (Settlement) Gratis: Cairkan hasil jualan ke rekening/e-wallet dengan mudah (*S&K Berlaku).\n\nAyo gabung sekarang - Daftar Gratis!\n🌐 Daftar di sini: https://kitapay.rinzgroup.web.id\n📌 Butuh bantuan integrasi ke sistem/bot kamu? Silakan DM atau tanya langsung di thread ini!`
    );
  }, []);

  // Simpan draf promosi ke localStorage setiap kali ada perubahan
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (posterUrl || captionText) {
        localStorage.setItem(
          'kitapay_promo_draft',
          JSON.stringify({
            posterUrl,
            captionText,
            selectedProductCode
          })
        );
      }
    } catch {}
  }, [posterUrl, captionText, selectedProductCode]);

  // Promo: Fetch History
  const fetchPromoHistory = useCallback(async () => {
    setLoadingPromoHistory(true);
    try {
      const res = await fetch(`${BOT_API_BASE_URL}/promo/history/${merchantId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPromoHistory(json.data);
        }
      }
    } catch (e) {
      console.warn('Gagal memuat riwayat promo:', e);
    } finally {
      setLoadingPromoHistory(false);
    }
  }, [merchantId]);

  // Promo: Fetch Contacts Count
  const fetchPromoContacts = useCallback(async () => {
    try {
      const res = await fetch(`${BOT_API_BASE_URL}/promo/contacts/${merchantId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && typeof json.count === 'number') {
          setPromoContactsCount(json.count);
        }
      }
    } catch (e) {
      console.warn('Gagal memuat kontak bot promo:', e);
    }
  }, [merchantId]);

  // Promo: Publish Promo to Status WA and/or Groups
  const handlePublishPromo = async () => {
    if (!posterUrl) {
      toast.error('Harap unggah poster gambar iklan terlebih dahulu.');
      return;
    }
    if (!captionText.trim()) {
      toast.error('Teks iklan / caption tidak boleh kosong.');
      return;
    }
    if (!targetStatus && !targetGroups) {
      toast.error('Pilih minimal satu target publikasi (Status WhatsApp atau Grup).');
      return;
    }
    if (targetGroups && promoTargetGroupJids.length === 0) {
      toast.error('Pilih minimal 1 grup sasaran iklan di daftar grup WhatsApp di bawah.');
      return;
    }

    setPublishingPromo(true);
    try {
      const targets: string[] = [];
      if (targetStatus) targets.push('status');
      if (targetGroups) targets.push('groups');

      const res = await fetch(`${BOT_API_BASE_URL}/promo/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          posterUrl,
          posterBase64: posterBase64 || undefined,
          caption: captionText,
          productCode: selectedProductCode || undefined,
          targets,
          targetGroupJids: promoTargetGroupJids
        })
      });

      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(
          res.status === 413
            ? 'Ukuran poster terlalu besar (maksimal 50MB).'
            : res.status === 502 || res.status === 503
            ? 'Layanan bot WhatsApp sedang offline. Silakan coba sesaat lagi.'
            : `Respon server bot tidak valid (HTTP ${res.status}).`
        );
      }

      if (res.ok && json.success) {
        const data = json.data;
        const statusOk = !targets.includes('status') || !!data.statusResult?.success;
        const groupsOk = !targets.includes('groups') || (!!data.groupsResult?.success && data.groupsResult?.sentCount > 0);

        if (statusOk && groupsOk) {
          let successMsg = 'Iklan berhasil diterbitkan!';
          if (data.statusResult?.success && data.groupsResult?.sentCount) {
            successMsg = `Iklan berhasil diposting ke Status WA (${data.statusResult.recipientsCount} kontak) dan ${data.groupsResult.sentCount} grup!`;
          } else if (data.statusResult?.success) {
            successMsg = `Iklan berhasil diposting ke Status WA (menjangkau ${data.statusResult.recipientsCount} kontak)!`;
          } else if (data.groupsResult?.sentCount) {
            successMsg = `Iklan berhasil dikirimkan ke ${data.groupsResult.sentCount} grup WhatsApp!`;
          }
          toast.success(successMsg);
        } else if (statusOk || groupsOk) {
          const warnMsg = data.statusResult?.error || data.groupsResult?.error || 'Sebagian target penyiaran gagal.';
          toast.info(`Terkirim sebagian: ${warnMsg}`);
        } else {
          const errMsg = data.statusResult?.error || data.groupsResult?.error || json.error || 'Gagal menerbitkan iklan.';
          toast.error(`Gagal: ${errMsg}`);
        }

        fetchPromoHistory();
        fetchPromoContacts();
      } else {
        toast.error(json.error || 'Gagal menerbitkan iklan.');
      }
    } catch (err: any) {
      toast.error(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setPublishingPromo(false);
    }
  };

  // Initial load
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.allSettled([fetchSessionStatus(), fetchProducts(), fetchOrders(), fetchGroups(), fetchPromoHistory(), fetchPromoContacts()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchSessionStatus, fetchProducts, fetchOrders, fetchGroups, fetchPromoHistory, fetchPromoContacts]);

  // Periodic poll if pairing or connecting
  useEffect(() => {
    if (session?.status === 'PAIRING' || session?.status === 'CONNECTING') {
      const interval = setInterval(() => {
        fetchSessionStatus();
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [session?.status, fetchSessionStatus]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([fetchSessionStatus(), fetchProducts(), fetchOrders(), fetchGroups()]);
    setRefreshing(false);
    toast.success('Data berhasil disinkronkan');
  };

  // Start WhatsApp Session
  const handleStartSession = async (mode: 'qr' | 'pairing') => {
    if (mode === 'pairing' && !pairingPhoneInput) {
      toast.error('Masukkan nomor WhatsApp untuk mode pairing code');
      return;
    }

    setIsStartingSession(true);
    try {
      const res = await fetch(`${BOT_API_BASE_URL}/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          mode,
          phoneNumber: pairingPhoneInput.trim(),
        }),
      });

      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(
          res.status === 413
            ? 'Ukuran poster terlalu besar (maksimal 50MB).'
            : res.status === 502 || res.status === 503
            ? 'Layanan bot WhatsApp sedang offline. Silakan coba sesaat lagi.'
            : `Respon server bot tidak valid (HTTP ${res.status}).`
        );
      }

      if (res.ok && json.success) {
        toast.success(
          mode === 'qr'
            ? 'QR Code berhasil dibuat. Silakan scan di WhatsApp.'
            : 'Kode pairing berhasil dibuat.'
        );
        await fetchSessionStatus();
      } else {
        toast.error(json.error || 'Gagal memulai sesi WhatsApp');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat memulai sesi');
    } finally {
      setIsStartingSession(false);
    }
  };

  // Logout Session
  const handleLogoutSession = async () => {
    const confirmed = await modal.confirm(
      'Apakah Anda yakin ingin memutuskan sambungan bot WhatsApp?',
      'Putuskan Sesi WhatsApp'
    );
    if (!confirmed) return;

    setIsLoggingOut(true);
    try {
      const res = await fetch(`${BOT_API_BASE_URL}/session/logout/${merchantId}`, {
        method: 'POST',
      });
      if (res.ok) {
        toast.success('Sesi WhatsApp berhasil diputuskan');
        await fetchSessionStatus();
      } else {
        const json = await res.json();
        toast.error(json.error || 'Gagal logout');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Save Settings (Owner Phone, Bot Name, Greeting)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch(`${BOT_API_BASE_URL}/session/settings/${merchantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_phone: ownerPhoneInput.trim(),
          bot_name: botNameInput.trim(),
          greeting_message: greetingInput.trim(),
        }),
      });

      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(
          res.status === 413
            ? 'Ukuran poster terlalu besar (maksimal 50MB).'
            : res.status === 502 || res.status === 503
            ? 'Layanan bot WhatsApp sedang offline. Silakan coba sesaat lagi.'
            : `Respon server bot tidak valid (HTTP ${res.status}).`
        );
      }

      if (res.ok && json.success) {
        toast.success('Pengaturan WhatsApp Owner berhasil disimpan');
        await fetchSessionStatus();
      } else {
        toast.error(json.error || 'Gagal menyimpan pengaturan');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan pengaturan');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Open Modal Create Product
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      code: '',
      name: '',
      description: '',
      price: '' as any,
      type: 'digital',
      stock: '' as any,
      digital_payload: '',
    });
    setIsProductModalOpen(true);
  };

  // Open Modal Edit Product
  const handleOpenEditProduct = (prod: BotProduct) => {
    setEditingProduct(prod);
    setProductForm({
      code: prod.code,
      name: prod.name,
      description: prod.description || '',
      price: prod.price,
      type: prod.type,
      stock: prod.stock,
      digital_payload: prod.digital_payload || '',
    });
    setIsProductModalOpen(true);
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.code.trim() || !productForm.name.trim()) {
      toast.error('Kode dan Nama Produk wajib diisi');
      return;
    }

    if (!productForm.price || Number(productForm.price) <= 0) {
      toast.error('Harga produk harus lebih dari 0');
      return;
    }

    setIsSubmittingProduct(true);
    try {
      const payload = {
        code: productForm.code.trim().toUpperCase(),
        name: productForm.name.trim(),
        description: (productForm.description || '').trim(),
        price: Number(productForm.price),
        type: productForm.type,
        stock: Number(productForm.stock) || 0,
        digital_payload: productForm.type === 'digital' ? (productForm.digital_payload || null) : null,
      };

      const res = await fetch(`${BOT_API_BASE_URL}/products/${merchantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(
          res.status === 413
            ? 'Ukuran poster terlalu besar (maksimal 50MB).'
            : res.status === 502 || res.status === 503
            ? 'Layanan bot WhatsApp sedang offline. Silakan coba sesaat lagi.'
            : `Respon server bot tidak valid (HTTP ${res.status}).`
        );
      }

      if (res.ok && json.success) {
        toast.success(`Produk "${payload.name}" berhasil disimpan`);
        setIsProductModalOpen(false);
        await fetchProducts();
      } else {
        toast.error(json.error || 'Gagal menyimpan produk');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan produk');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (prod: BotProduct) => {
    const confirmed = await modal.confirm(
      `Hapus produk "${prod.name}" (${prod.code}) dari katalog WhatsApp?`,
      'Hapus Produk'
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`${BOT_API_BASE_URL}/products/${merchantId}/${prod.id || prod.code}`, {
        method: 'DELETE',
      });
      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(
          res.status === 413
            ? 'Ukuran poster terlalu besar (maksimal 50MB).'
            : res.status === 502 || res.status === 503
            ? 'Layanan bot WhatsApp sedang offline. Silakan coba sesaat lagi.'
            : `Respon server bot tidak valid (HTTP ${res.status}).`
        );
      }

      if (res.ok && json.success) {
        toast.success(`Produk "${prod.name}" berhasil dihapus`);
        await fetchProducts();
      } else {
        toast.error(json.error || 'Gagal menghapus produk');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus produk');
    }
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin`);
  };

  // Format IDR
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchCategory = productFilter === 'all' || p.type === productFilter;
    const matchSearch =
      searchProduct === '' ||
      p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.code.toLowerCase().includes(searchProduct.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchProduct.toLowerCase()));
    return matchCategory && matchSearch;
  });

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const matchFilter = orderFilter === 'all' || o.status === orderFilter;
    const matchSearch =
      searchOrder === '' ||
      o.invoice_code.toLowerCase().includes(searchOrder.toLowerCase()) ||
      o.customer_phone.includes(searchOrder) ||
      (o.shipping_address && o.shipping_address.toLowerCase().includes(searchOrder.toLowerCase())) ||
      (o.order_notes && o.order_notes.toLowerCase().includes(searchOrder.toLowerCase()));
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header (Clean KitaPay Standard) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">KitaOrder</h1>
          <p className="text-slate-500 text-sm mt-1">
            Katalog produk WhatsApp, bot pemesanan otomatis, dan alert pesanan owner.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              const pending = orders.find((o) => o.status === 'UNPAID');
              if (pending) setSelectedInvoice(pending.invoice_code);
              setSimulationResult(null);
              setIsSimulatorOpen(true);
            }}
            className="flex items-center justify-center space-x-1.5 bg-white border border-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
            title="Simulator Webhook Transaksi Sukses"
          >
            <Lightning weight="bold" className="w-3.5 h-3.5 text-slate-500" />
            <span>Simulasi Webhook</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center justify-center space-x-1.5 bg-white border border-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowsClockwise weight="bold" className={cn('w-3.5 h-3.5 text-slate-500', refreshing && 'animate-spin')} />
            <span>Sinkronkan</span>
          </button>
          <button
            onClick={handleOpenAddProduct}
            className="flex items-center justify-center space-x-1.5 bg-[#00DDFD] hover:bg-[#00c5e3] text-slate-900 px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-2xs"
          >
            <Plus weight="bold" className="w-4 h-4" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* 2. Metrics (Clean Fintech Style - No AI Slop / Cluttered Badges) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Bot WhatsApp */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status Bot</p>
          <h3 className="text-xl font-bold text-slate-800 mt-1">
            {session?.status === 'CONNECTED' ? `+${session.phoneNumber}` : 'Tidak Aktif'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                session?.status === 'CONNECTED' ? 'bg-emerald-500' : 'bg-slate-300'
              )}
            />
            {session?.status === 'CONNECTED' ? 'Online & siap menerima order' : 'Sambungkan di tab Pengaturan'}
          </p>
        </div>

        {/* Card 2: WhatsApp Owner */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">WhatsApp Owner</p>
          <h3 className="text-xl font-bold text-slate-800 mt-1">
            {session?.ownerPhone ? `+${session.ownerPhone}` : 'Belum Diset'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {session?.ownerPhone ? 'Menerima notifikasi order fisik & jasa' : 'Wajib diisi untuk alert fisik & jasa'}
          </p>
        </div>

        {/* Card 3: Total Produk */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Katalog Produk</p>
          <h3 className="text-xl font-bold text-slate-800 mt-1">
            {products.length} <span className="text-xs font-normal text-slate-400">item</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {products.filter((p) => p.type === 'digital').length} Digital ·{' '}
            {products.filter((p) => p.type === 'physical').length} Fisik ·{' '}
            {products.filter((p) => p.type === 'service').length} Jasa
          </p>
        </div>

        {/* Card 4: Total Pesanan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pesanan WA</p>
          <h3 className="text-xl font-bold text-slate-800 mt-1">
            {orders.length} <span className="text-xs font-normal text-slate-400">pesanan</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {orders.filter((o) => o.status === 'PAID').length} Transaksi Lunas
          </p>
        </div>
      </div>

      {/* 3. Underline Tabs (KitaPay Native) */}
      <div className="flex items-center space-x-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('katalog')}
          className={cn(
            'pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px',
            activeTab === 'katalog'
              ? 'border-[#00DDFD] text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          Katalog Produk ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('promosi')}
          className={cn(
            'pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center gap-1.5',
            activeTab === 'promosi'
              ? 'border-[#00DDFD] text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <span>Promosi &amp; Iklan (Story &amp; Grup)</span>
          <span className="px-1.5 py-0.5 text-[10px] bg-cyan-100 text-cyan-800 font-bold rounded-full">Baru</span>
        </button>

        <button
          onClick={() => setActiveTab('koneksi')}
          className={cn(
            'pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px',
            activeTab === 'koneksi'
              ? 'border-[#00DDFD] text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          Koneksi &amp; Notifikasi Owner
        </button>

        <button
          onClick={() => setActiveTab('pesanan')}
          className={cn(
            'pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px',
            activeTab === 'pesanan'
              ? 'border-[#00DDFD] text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          Riwayat Pesanan WA ({orders.length})
        </button>
      </div>

      {/* TAB CONTENT 1: KATALOG PRODUK */}
      {activeTab === 'katalog' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            {/* Filter Segmented Control */}
            <div className="inline-flex bg-slate-100 p-1 rounded-xl">
              {(['all', 'digital', 'physical', 'service'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setProductFilter(cat)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-semibold transition',
                    productFilter === cat
                      ? 'bg-white text-slate-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  {cat === 'all' && 'Semua'}
                  {cat === 'digital' && 'Digital'}
                  {cat === 'physical' && 'Fisik'}
                  {cat === 'service' && 'Jasa'}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode atau nama produk..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-800"
              />
            </div>
          </div>

          {/* Product Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 text-slate-500 font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Kode</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Nama Produk</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Tipe</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Harga</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Stok</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Keterangan</th>
                  <th className="py-3.5 px-4 text-right font-semibold uppercase tracking-wider text-[11px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <p className="font-medium text-slate-600 text-sm">Tidak ada produk ditemukan</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Klik tombol "Tambah Produk" di atas untuk menambahkan item baru ke katalog WhatsApp.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.code} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-xs text-slate-800">
                        {p.code}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-900 text-xs">{p.name}</p>
                        {p.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-1">{p.description}</p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-medium text-slate-600 capitalize">
                        {p.type === 'digital' ? 'Digital' : p.type === 'physical' ? 'Fisik' : 'Jasa'}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-900 text-xs">
                        {formatRupiah(p.price)}
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        {p.stock > 0 ? (
                          <span className="text-slate-600">{p.stock}</span>
                        ) : (
                          <span className="text-rose-600 font-medium">Habis</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs text-xs text-slate-500">
                        {p.type === 'digital' ? (
                          p.digital_payload ? (
                            <span className="font-mono text-slate-600 truncate block max-w-[200px]" title={p.digital_payload}>
                              {p.digital_payload}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Otomatis saat lunas</span>
                          )
                        ) : p.type === 'physical' ? (
                          <span>Kirim fisik + alert owner</span>
                        ) : (
                          <span>Layanan jasa + alert owner</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Edit"
                          >
                            <PencilSimple className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Hapus"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PROMOSI & PENYIARAN WHATSAPP (CLEAN BESPOKE FINTECH UI) */}
      {activeTab === 'promosi' && (
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/80">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Siaran &amp; Promosi</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kirim materi promosi visual langsung ke Status WhatsApp (Story) dan Grup Komunitas pilihan Anda.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-600 font-medium">
                <span className={cn('w-2 h-2 rounded-full', session?.status === 'CONNECTED' ? 'bg-emerald-500' : 'bg-slate-300')} />
                <span>{session?.status === 'CONNECTED' ? 'Bot Siap Siar' : 'Bot Offline'}</span>
                {session?.phoneNumber && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-slate-500 text-[11px]">+{session.phoneNumber}</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Form & Live Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form Materi & Target (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Card 1: Materi Penyiaran */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Materi Promosi</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Poster gambar dan pesan penawaran yang akan disiarkan.</p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">PNG / JPG / WebP</span>
                </div>

                {/* Upload Poster Zone */}
                <div>
                  <input
                    id="poster-upload-input"
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handlePosterUpload}
                    className="hidden"
                  />

                  {isUploadingPoster ? (
                    <div className="border border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/60">
                      <CircleNotch className="w-6 h-6 text-slate-700 animate-spin mb-2" />
                      <p className="text-xs font-semibold text-slate-800">Mengunggah ke Cloudinary...</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Menyimpan aset gambar di CDN KitaPay</p>
                    </div>
                  ) : posterUrl ? (
                    <div className="space-y-2.5">
                      <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center max-h-[280px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={posterUrl}
                          alt="Poster Iklan"
                          className="w-full h-auto max-h-[280px] object-contain"
                        />
                        <div className="absolute top-2.5 right-2.5">
                          <span className="px-2 py-0.5 bg-slate-900/85 text-emerald-400 text-[10px] font-semibold rounded-md backdrop-blur-xs flex items-center gap-1 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Tersimpan di Cloudinary
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor="poster-upload-input"
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg cursor-pointer transition flex items-center gap-1.5"
                        >
                          <UploadSimple className="w-3.5 h-3.5" />
                          <span>Ganti Poster</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => { setPosterUrl(''); setPosterBase64(''); }}
                          className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 text-xs font-medium rounded-lg transition flex items-center gap-1"
                        >
                          <Trash className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="poster-upload-input"
                      className="border border-dashed border-slate-300 hover:border-slate-700 rounded-xl p-7 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-slate-800 transition shadow-2xs mb-2.5">
                        <UploadSimple className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-800">Klik untuk Unggah Poster</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Seret file gambar promosi Anda ke sini (Maksimal 10MB)</p>
                    </label>
                  )}
                </div>

                {/* Teks / Pesan WhatsApp */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-slate-700">Teks Pesan WhatsApp</label>
                    {products.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400">Sisipkan:</span>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleInsertProductInfo(e.target.value);
                              e.target.value = '';
                            }
                          }}
                          defaultValue=""
                          className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg border-0 cursor-pointer"
                        >
                          <option value="" disabled>+ Pilih Produk</option>
                          {products.map((p) => (
                            <option key={p.code} value={p.code}>
                              {p.name} ({formatRupiah(p.price)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <textarea
                    value={captionText}
                    onChange={(e) => setCaptionText(e.target.value)}
                    placeholder="Tulis pesan promosi yang ingin disiarkan bersama poster..."
                    rows={5}
                    className="w-full px-3 py-2.5 text-xs text-slate-900 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 font-normal placeholder:text-slate-400 leading-relaxed font-sans"
                  />

                  {/* Helpers Toolbar */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCaptionText(
                            `🔥 *RESTOCK PRODUK TERBARU*\nDapatkan harga spesial terbatas hari ini.\n\n👉 *Pemesanan Cepat:*\nBalas pesan ini: ketik *!beli [KODE]*`
                          );
                        }}
                        className="text-slate-600 hover:text-slate-900 hover:underline"
                      >
                        + Template Restock
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCaptionText(
                            `⚡ *FLASH SALE HARI INI*\nPenawaran terbatas untuk pelanggan setia.\n\n👉 Ketik *!katalog* untuk melihat seluruh produk.`
                          );
                        }}
                        className="text-slate-600 hover:text-slate-900 hover:underline"
                      >
                        + Template Flash Sale
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPosterUrl('https://res.cloudinary.com/djkkckmig/image/upload/v1794009286/kitapay_promosi/klhdpydwf7justsgx0e6.png');
                          setCaptionText(
                            `TRANSAKSI GA RIBET LAGI PAKE KITAPAY !\nJADI MERCHANT SEKARANG,\n\nkitapay.rinzgroup.web.id\n\n✔ Bisa Sambung ke Bot & Web: Cocok buat toko otomatis 24 jam (Bot Auto-Order, Website, Marketplace).\n✔ Pencairan (Settlement) Gratis: Cairkan hasil jualan ke rekening/e-wallet dengan mudah (*S&K Berlaku).\n\nAyo gabung sekarang - Daftar Gratis!\n🌐 Daftar di sini: https://kitapay.rinzgroup.web.id\n📌 Butuh bantuan integrasi ke sistem/bot kamu? Silakan DM atau tanya langsung di thread ini!`
                          );
                          toast.success('Poster & teks promosi berhasil dipulihkan!');
                        }}
                        className="text-cyan-700 hover:text-cyan-900 font-semibold hover:underline"
                      >
                        + Pulihkan Draf
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setCaptionText('')}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        Kosongkan
                      </button>
                    </div>
                    <span>{captionText.length} Karakter</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Target Saluran Penyiaran */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-bold text-slate-900">Target Saluran Penyiaran</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Tentukan saluran WhatsApp yang dituju untuk penyiaran iklan ini.</p>
                </div>

                <div className="space-y-3">
                  {/* Saluran 1: Status WA */}
                  <label className={cn(
                    'flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition',
                    targetStatus ? 'bg-slate-50/80 border-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50/50'
                  )}>
                    <input
                      type="checkbox"
                      checked={targetStatus}
                      onChange={(e) => setTargetStatus(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900">Status WhatsApp (Story)</span>
                          <span className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-600 font-medium rounded">Pembaruan</span>
                        </div>
                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {promoContactsCount > 0 ? `${promoContactsCount} Kontak Bot` : 'Kontak Saya'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Ditayangkan ke tab Pembaruan WhatsApp untuk seluruh kontak yang tersimpan di buku telepon bot, pembeli, dan owner toko (seperti fitur &quot;Kontak Saya&quot; di WA biasa).
                      </p>
                    </div>
                  </label>

                  {/* Saluran 2: Grup WhatsApp */}
                  <div className="space-y-3">
                    <label className={cn(
                      'flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition',
                      targetGroups ? 'bg-slate-50/80 border-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50/50'
                    )}>
                      <input
                        type="checkbox"
                        checked={targetGroups}
                        onChange={(e) => setTargetGroups(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-900">Grup WhatsApp Komunitas / Toko</span>
                          <span className="text-[11px] font-medium text-slate-500">
                            {promoTargetGroupJids.length} dari {groups.length} grup dipilih
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          Menyiarkan poster &amp; pesan penawaran langsung ke obrolan grup WhatsApp terpilih.
                        </p>
                      </div>
                    </label>

                    {/* Group Selector Box */}
                    {targetGroups && (
                      <div className="p-3.5 bg-slate-50/60 border border-slate-200 rounded-xl space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs pb-2 border-b border-slate-200/70 gap-2">
                          <span className="font-semibold text-slate-700">Daftar Grup Sasaran:</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPromoTargetGroupJids(groups.map((g) => g.id))}
                              className="text-[11px] text-slate-600 hover:text-slate-900 font-medium"
                            >
                              Pilih Semua
                            </button>
                            {groups.some(g => g.isWhitelisted) && (
                              <>
                                <span className="text-slate-300">•</span>
                                <button
                                  type="button"
                                  onClick={() => setPromoTargetGroupJids(groups.filter(g => g.isWhitelisted).map(g => g.id))}
                                  className="text-[11px] text-slate-600 hover:text-slate-900 font-medium"
                                >
                                  Hanya Whitelist
                                </button>
                              </>
                            )}
                            <span className="text-slate-300">•</span>
                            <button
                              type="button"
                              onClick={() => setPromoTargetGroupJids([])}
                              className="text-[11px] text-rose-600 hover:underline"
                            >
                              Kosongkan
                            </button>
                          </div>
                        </div>

                        {groups.length > 3 && (
                          <div className="relative">
                            <MagnifyingGlass className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Cari grup..."
                              value={promoGroupSearch}
                              onChange={(e) => setPromoGroupSearch(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-800 placeholder:text-slate-400"
                            />
                          </div>
                        )}

                        {groups.length === 0 ? (
                          <p className="py-2 text-center text-slate-400 text-xs">
                            Tidak ada grup yang terdeteksi pada bot ini.
                          </p>
                        ) : (
                          <div className="max-h-48 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100">
                            {groups
                              .filter((grp) => !promoGroupSearch || grp.name.toLowerCase().includes(promoGroupSearch.toLowerCase()))
                              .map((grp) => {
                                const isSelected = promoTargetGroupJids.includes(grp.id);
                                return (
                                  <div
                                    key={grp.id}
                                    onClick={() => {
                                      if (isSelected) {
                                        setPromoTargetGroupJids((prev) => prev.filter((id) => id !== grp.id));
                                      } else {
                                        setPromoTargetGroupJids((prev) => [...prev, grp.id]);
                                      }
                                    }}
                                    className={cn(
                                      'flex items-center justify-between py-2 px-2.5 rounded-lg cursor-pointer text-xs transition border',
                                      isSelected
                                        ? 'bg-white border-slate-400 shadow-2xs'
                                        : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'
                                    )}
                                  >
                                    <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {}}
                                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 shrink-0"
                                      />
                                      <div className="min-w-0">
                                        <p className="font-medium text-slate-900 truncate" title={grp.name}>
                                          {grp.name}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                          {grp.participantCount} anggota
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                                      {grp.isWhitelisted ? (
                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold rounded">
                                          Whitelist
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleToggleGroup(grp)}
                                          disabled={togglingGroupId === grp.id}
                                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-medium rounded border border-slate-200 transition"
                                          title="Izinkan bot melayani pesanan di grup ini"
                                        >
                                          {togglingGroupId === grp.id ? '...' : '+ Whitelist'}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}

                        {promoTargetGroupJids.length === 0 && groups.length > 0 && (
                          <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-lg text-amber-800 text-[11px] flex items-center gap-1.5">
                            <WarningCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                            <span>Pilih minimal 1 grup WhatsApp di atas sebagai tujuan iklan.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Subtle Policy Note */}
                <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Pesan hanya disiarkan ke saluran yang Anda pilih. Tidak ada broadcast chat pribadi massal.</span>
                </div>
              </div>

              {/* Publish Action Button */}
              <button
                type="button"
                onClick={handlePublishPromo}
                disabled={publishingPromo || !posterUrl || !captionText.trim() || (!targetStatus && !targetGroups)}
                className={cn(
                  'w-full py-3.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs',
                  publishingPromo || !posterUrl || !captionText.trim() || (!targetStatus && !targetGroups)
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    : 'bg-slate-900 hover:bg-black text-white cursor-pointer active:scale-[0.99]'
                )}
              >
                {publishingPromo ? (
                  <>
                    <CircleNotch className="w-4 h-4 animate-spin" />
                    <span>Sedang Menyiarkan Materi ke WhatsApp...</span>
                  </>
                ) : (
                  <>
                    <PaperPlaneRight className="w-4 h-4" />
                    <span>Terbitkan Siaran Sekarang</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Column: Live Pratinjau Siaran (5 cols) */}
            <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-6">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Pratinjau Siaran</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Tampilan materi yang akan diterima audiens.</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    WhatsApp
                  </span>
                </div>

                {/* Target Pills */}
                <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                  {targetStatus && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                      Status WA
                    </span>
                  )}
                  {targetGroups && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                      {promoTargetGroupJids.length} Grup
                    </span>
                  )}
                </div>

                {/* Clean Realistic Message Card */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
                  {/* Poster Image */}
                  <div className="w-full bg-slate-900/5 rounded-lg overflow-hidden flex items-center justify-center min-h-[160px] border border-slate-200/70">
                    {posterUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={posterUrl}
                        alt="Poster Iklan"
                        className="w-full h-auto object-contain max-h-[300px] rounded-lg"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 py-8 px-4 text-center">
                        <ImageIcon className="w-8 h-8 mb-1.5 opacity-40" />
                        <span className="text-xs font-medium text-slate-500">Poster belum diunggah</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Unggah gambar di panel sebelah kiri</span>
                      </div>
                    )}
                  </div>

                  {/* Caption Content */}
                  <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans bg-white p-3 rounded-lg border border-slate-200/60 shadow-2xs">
                    {captionText || (
                      <span className="text-slate-400 italic text-[11px]">
                        Teks penawaran akan ditampilkan di sini bersama poster...
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>Format: Gambar + Teks</span>
                    <span>Sekarang ✓✓</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Gambar disiarkan dengan resolusi penuh langsung melalui CDN Cloudinary KitaPay.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Card: Riwayat Penyiaran */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Riwayat Penyiaran</h3>
                <p className="text-xs text-slate-500 mt-0.5">Daftar penyiaran iklan yang telah diterbitkan ke WhatsApp.</p>
              </div>
              <button
                type="button"
                onClick={fetchPromoHistory}
                disabled={loadingPromoHistory}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowsClockwise className={cn('w-3.5 h-3.5', loadingPromoHistory && 'animate-spin')} />
                <span>Segarkan</span>
              </button>
            </div>

            {promoHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Belum ada riwayat iklan yang disiarkan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Waktu</th>
                      <th className="py-2.5 px-3">Poster</th>
                      <th className="py-2.5 px-3">Cuplikan Pesan</th>
                      <th className="py-2.5 px-3">Saluran</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {promoHistory.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/60">
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="py-3 px-3">
                          {item.posterUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={item.posterUrl}
                              alt="Poster"
                              className="w-9 h-9 object-cover rounded-lg border border-slate-200"
                            />
                          ) : (
                            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-900 max-w-xs truncate">
                          {item.productName || item.caption?.substring(0, 40) || 'Iklan WhatsApp'}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.targets?.includes('status') && (
                              <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-700">
                                Status WA ({item.statusResult?.recipientsCount || 0} kontak)
                              </span>
                            )}
                            {item.targets?.includes('groups') && (
                              <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-700">
                                {item.groupsResult?.sentCount || 0} Grup
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {(() => {
                            const statusSuccess = item.statusResult?.success;
                            const groupsSuccess = item.groupsResult?.success && item.groupsResult?.sentCount > 0;
                            const targets = item.targets || [];
                            const expectsStatus = targets.includes('status');
                            const expectsGroups = targets.includes('groups');

                            const allSuccess = (!expectsStatus || statusSuccess) && (!expectsGroups || groupsSuccess);
                            const partialSuccess = (expectsStatus && statusSuccess) || (expectsGroups && groupsSuccess);

                            if (allSuccess) {
                              return (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Terkirim</span>
                                </span>
                              );
                            } else if (partialSuccess) {
                              return (
                                <span
                                  className="inline-flex items-center gap-1 text-amber-600 font-semibold text-[11px] cursor-help"
                                  title={item.errorMessage || item.statusResult?.error || item.groupsResult?.error || 'Sebagian target penyiaran gagal'}
                                >
                                  <WarningCircle className="w-3.5 h-3.5" />
                                  <span>Sebagian</span>
                                </span>
                              );
                            } else {
                              return (
                                <span
                                  className="inline-flex items-center gap-1 text-rose-600 font-semibold text-[11px] cursor-help"
                                  title={item.errorMessage || item.statusResult?.error || item.groupsResult?.error || 'Penyiaran ke WhatsApp gagal'}
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Gagal</span>
                                </span>
                              );
                            }
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: WHATSAPP CONNECTION & OWNER SETTINGS */}
      {activeTab === 'koneksi' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Kolom Kiri: WhatsApp Bot Connection */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-800">Koneksi Sesi WhatsApp</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola sambungan WhatsApp Web (Baileys) untuk nomor bot toko Anda.
              </p>
            </div>

            {session?.status === 'CONNECTED' ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-start gap-3 text-xs text-emerald-900">
                  <CheckCircle weight="fill" className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">WhatsApp Bot Terhubung</p>
                    <p>
                      Nomor aktif: <strong className="font-mono text-emerald-800">+{session.phoneNumber}</strong>
                    </p>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      Bot siap melayani chat dari pembeli, memberikan tagihan invoice, dan mengirimkan QRIS instan secara otomatis.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogoutSession}
                  disabled={isLoggingOut}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold rounded-xl transition"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{isLoggingOut ? 'Memutuskan...' : 'Putuskan Sambungan Bot'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Switch Mode */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setConnectMode('qr')}
                    className={cn(
                      'flex-1 py-1.5 text-xs font-semibold rounded-lg transition',
                      connectMode === 'qr'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    Scan QR Code
                  </button>
                  <button
                    onClick={() => setConnectMode('pairing')}
                    className={cn(
                      'flex-1 py-1.5 text-xs font-semibold rounded-lg transition',
                      connectMode === 'pairing'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    Pairing Code 8-Digit
                  </button>
                </div>

                {connectMode === 'qr' && (
                  <div className="text-center py-4">
                    {session?.qr ? (
                      <div className="space-y-3">
                        <div className="inline-block p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                          {session.qr.startsWith('data:image') || session.qr.startsWith('http') ? (
                            <img
                              src={session.qr}
                              alt="WhatsApp QR Code"
                              className="w-52 h-52 object-contain mx-auto"
                            />
                          ) : (
                            <QRCodeSVG value={session.qr} size={200} level="M" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          Buka WhatsApp di HP &gt; Perangkat Tertaut &gt; Tautkan Perangkat.
                        </p>
                      </div>
                    ) : (
                      <div className="p-6 border border-slate-200 rounded-xl space-y-3 bg-slate-50/50">
                        <QrCode weight="light" className="w-10 h-10 mx-auto text-slate-400" />
                        <p className="text-xs text-slate-500">
                          Buat QR Code WhatsApp Web untuk ditautkan dengan nomor HP bot.
                        </p>
                        <button
                          onClick={() => handleStartSession('qr')}
                          disabled={isStartingSession}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
                        >
                          {isStartingSession ? 'Membuat QR Code...' : 'Buat QR Code'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {connectMode === 'pairing' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nomor WhatsApp Bot
                      </label>
                      <input
                        type="text"
                        placeholder="081234567890"
                        value={pairingPhoneInput}
                        onChange={(e) => setPairingPhoneInput(e.target.value)}
                        className="w-full px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-800"
                      />
                    </div>

                    <button
                      onClick={() => handleStartSession('pairing')}
                      disabled={isStartingSession}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
                    >
                      {isStartingSession ? 'Meminta Kode...' : 'Dapatkan Kode Pairing'}
                    </button>

                    {session?.pairingCode && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                        <p className="text-xs text-slate-600">Kode Pairing WhatsApp:</p>
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono text-xl font-bold tracking-widest text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-300">
                            {session.pairingCode}
                          </span>
                          <button
                            onClick={() => handleCopy(session.pairingCode!, 'Kode Pairing')}
                            className="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg"
                            title="Salin"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Kolom Kanan: Pengaturan Nomor Owner & Identitas Bot */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-800">Notifikasi WhatsApp Owner</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengaturan nomor pengelola untuk menerima detail order produk fisik &amp; jasa.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                <p>
                  <strong>Fungsi Nomor Owner:</strong> Setiap ada pelanggan yang membeli barang <strong>Fisik</strong> (dengan alamat pengiriman) atau <strong>Jasa</strong> (dengan catatan instruksi), bot akan otomatis mengirimkan pesan WhatsApp ke nomor ini dengan detail pemesanan dan tautan langsung untuk menghubungi pembeli.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp Owner / Admin <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="081219363321 atau 6281219363321"
                  value={ownerPhoneInput}
                  onChange={(e) => setOwnerPhoneInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-800 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Bot / Toko
                </label>
                <input
                  type="text"
                  placeholder="KitaOrder"
                  value={botNameInput}
                  onChange={(e) => setBotNameInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pesan Pembuka (Greeting)
                </label>
                <textarea
                  rows={2}
                  value={greetingInput}
                  onChange={(e) => setGreetingInput(e.target.value)}
                  placeholder="Selamat datang di toko kami! Ketik *!katalog* untuk melihat daftar produk."
                  className="w-full px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingSettings}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
              >
                {isSavingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </form>
          </div>

          {/* Baris 2 (Full Width): Whitelist Grup WhatsApp */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-800">Izin Bot di Grup WhatsApp (Whitelist)</h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                    Non-Teknis
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Secara default, bot WhatsApp 100% diam di grup agar tidak menyela obrolan. Aktifkan sakelar grup di bawah ini jika ingin bot melayani pesanan di grup tersebut.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchGroups}
                disabled={loadingGroups}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition shadow-2xs shrink-0 cursor-pointer"
              >
                <ArrowsClockwise className={cn('w-3.5 h-3.5', loadingGroups && 'animate-spin')} />
                <span>Muat Ulang Grup</span>
              </button>
            </div>

            {/* Quick Chat Shortcut Info */}
            <div className="p-3.5 bg-gradient-to-r from-cyan-50/70 to-blue-50/70 border border-cyan-200/80 rounded-xl flex items-start gap-3 text-xs text-slate-700">
              <span className="text-lg">💡</span>
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">Cara Cepat Tanpa Buka Web (Langsung di Chat WhatsApp):</p>
                <p className="text-slate-600 leading-relaxed">
                  Pemilik toko cukup mengetik <code className="px-1.5 py-0.5 bg-white rounded font-mono font-bold text-cyan-900">!bot on</code> di dalam grup mana saja untuk mengaktifkan bot, atau <code className="px-1.5 py-0.5 bg-white rounded font-mono font-bold text-rose-900">!bot off</code> untuk mematikan. Bot otomatis mengenali nomor owner!
                </p>
              </div>
            </div>

            {/* Search Group Filter */}
            {groups.length > 4 && (
              <div className="relative">
                <MagnifyingGlass className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama grup WhatsApp..."
                  value={searchGroup}
                  onChange={(e) => setSearchGroup(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800"
                />
              </div>
            )}

            {/* Group List Table / Cards */}
            {loadingGroups ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <ArrowsClockwise className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                Memuat daftar grup WhatsApp dari bot...
              </div>
            ) : groups.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="font-semibold text-slate-700">Belum Ada Grup yang Ditemukan</p>
                <p className="mt-1 text-slate-400">Pastikan bot WhatsApp sudah terhubung dan telah bergabung ke dalam grup.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {groups
                  .filter(g => !searchGroup || g.name.toLowerCase().includes(searchGroup.toLowerCase()))
                  .map((g) => (
                    <div
                      key={g.id}
                      className={cn(
                        'p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3',
                        g.isWhitelisted
                          ? 'bg-emerald-50/40 border-emerald-300 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs',
                          g.isWhitelisted ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                        )}>
                          <UsersThree weight="bold" className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-slate-900 truncate" title={g.name}>
                            {g.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            <span>{g.participantCount} Anggota</span>
                            <span>•</span>
                            <span className={cn(
                              'font-semibold',
                              g.isWhitelisted ? 'text-emerald-700' : 'text-slate-400'
                            )}>
                              {g.isWhitelisted ? '🟢 Diizinkan (Aktif)' : '⚪ Dibisukan (Mute)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleGroup(g)}
                        disabled={togglingGroupId === g.id}
                        className={cn(
                          'px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 shadow-2xs cursor-pointer',
                          g.isWhitelisted
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20'
                        )}
                      >
                        {togglingGroupId === g.id
                          ? 'Memproses...'
                          : g.isWhitelisted
                          ? 'Nonaktifkan'
                          : 'Izinkan Bot'}
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: RIWAYAT PESANAN WHATSAPP */}
      {activeTab === 'pesanan' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="inline-flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setOrderFilter('all')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-semibold transition',
                  orderFilter === 'all'
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                Semua ({orders.length})
              </button>
              <button
                onClick={() => setOrderFilter('PAID')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-semibold transition',
                  orderFilter === 'PAID'
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                Lunas ({orders.filter((o) => o.status === 'PAID').length})
              </button>
              <button
                onClick={() => setOrderFilter('UNPAID')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-semibold transition',
                  orderFilter === 'UNPAID'
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                Menunggu Bayar ({orders.filter((o) => o.status === 'UNPAID').length})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Invoice atau Nomor HP..."
                value={searchOrder}
                onChange={(e) => setSearchOrder(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-800"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 text-slate-500 font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Invoice</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Pelanggan</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Rincian Item</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Total</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Alamat / Instruksi</th>
                  <th className="py-3.5 px-4 font-semibold uppercase tracking-wider text-[11px]">Status</th>
                  <th className="py-3.5 px-4 text-right font-semibold uppercase tracking-wider text-[11px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <p className="font-medium text-slate-600 text-sm">Belum ada pesanan via WhatsApp</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Pesanan dari obrolan pelanggan akan otomatis tercatat di sini.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr key={ord.invoice_code} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-semibold text-xs text-slate-800">
                          {ord.invoice_code}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(ord.created_at).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <p className="font-medium text-slate-800">
                          {ord.customer_name || 'Pelanggan WA'}
                        </p>
                        <a
                          href={`https://wa.me/${ord.customer_phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 font-mono mt-0.5"
                        >
                          +{ord.customer_phone}
                          <ArrowSquareOut className="w-3 h-3 text-slate-400" />
                        </a>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        {ord.items &&
                          ord.items.map((it, idx) => (
                            <div key={idx} className="text-slate-600 flex items-center gap-1.5">
                              <span>{it.name}</span>
                              <span className="text-slate-400 font-mono text-[11px]">×{it.qty}</span>
                            </div>
                          ))}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-900 text-xs">
                        {formatRupiah(ord.total_amount)}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs text-xs text-slate-600">
                        {ord.shipping_address ? (
                          <p className="line-clamp-2 text-slate-600">{ord.shipping_address}</p>
                        ) : ord.order_notes ? (
                          <p className="line-clamp-2 text-slate-600">{ord.order_notes}</p>
                        ) : (
                          <span className="text-slate-400 italic">Produk Digital (Instan)</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            'text-xs font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1',
                            ord.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700'
                              : ord.status === 'UNPAID'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          )}
                        >
                          {ord.status === 'PAID' ? 'Lunas' : ord.status === 'UNPAID' ? 'Menunggu Bayar' : ord.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {ord.status === 'UNPAID' && (
                            <button
                              onClick={() => handleRunSimulation(ord.invoice_code)}
                              disabled={quickSimulatingId === ord.invoice_code}
                              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium rounded-lg transition shadow-2xs"
                              title="Simulasikan Pelanggan Membayar QRIS ini (Kirim Webhook)"
                            >
                              {quickSimulatingId === ord.invoice_code ? 'Memproses...' : 'Simulasi Bayar'}
                            </button>
                          )}
                          <a
                            href={`https://wa.me/${ord.customer_phone}?text=Halo%20kak%2C%20terima%20kasih%20telah%20order%20di%20toko%20kami%20dengan%20nomor%20invoice%20${ord.invoice_code}.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-medium rounded-lg transition"
                          >
                            Chat
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT PRODUK */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Kode Produk <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: VP100"
                    value={productForm.code}
                    onChange={(e) => setProductForm({ ...productForm, code: e.target.value.toUpperCase() })}
                    disabled={!!editingProduct}
                    className="w-full px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-800 font-mono uppercase font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Tipe Produk <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={productForm.type}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        type: e.target.value as 'digital' | 'physical' | 'service',
                      })
                    }
                    className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-800 font-medium"
                  >
                    <option value="digital">Digital (Instan)</option>
                    <option value="physical">Fisik (Butuh Alamat)</option>
                    <option value="service">Jasa (Butuh Instruksi)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Nama Produk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kaos Oversize / Voucher Game 100K"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-800 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Harga (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 95000"
                    value={productForm.price || ''}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-800 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Stok <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 10"
                    value={productForm.stock || ''}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-800 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Deskripsi Singkat
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan singkat tentang produk..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-800"
                />
              </div>

              {productForm.type === 'digital' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <label className="block text-xs font-semibold text-slate-800">
                    Payload / Kode Digital Otomatis
                  </label>
                  <textarea
                    rows={2}
                    placeholder="KODE-VOUCHER / LINK DOWNLOAD (dikirim otomatis saat QRIS lunas)..."
                    value={productForm.digital_payload || ''}
                    onChange={(e) => setProductForm({ ...productForm, digital_payload: e.target.value })}
                    className="w-full px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-800 font-mono"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition"
                >
                  {isSubmittingProduct ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SIMULATOR WEBHOOK & PEMBAYARAN SUKSES */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Lightning weight="fill" className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Simulator Webhook Transaksi</h3>
                  <p className="text-xs text-slate-500">Uji alur bot dari pembayaran hingga auto-fulfillment</p>
                </div>
              </div>
              <button
                onClick={() => setIsSimulatorOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Info Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed space-y-1">
                <p className="font-semibold text-slate-800">Bagaimana Cara Kerjanya?</p>
                <p>
                  Simulator ini mengirimkan event callback <code>payment.success</code> resmi dari KitaPay ke Bot Engine, memicu auto-fulfillment WhatsApp ke pembeli dan notifikasi alert ke WhatsApp Owner tanpa perlu membayar uang sungguhan.
                </p>
              </div>

              {/* Selector Invoice */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Pilih Pesanan Menunggu Bayar (UNPAID)
                </label>
                {orders.filter((o) => o.status === 'UNPAID').length > 0 ? (
                  <select
                    value={selectedInvoice}
                    onChange={(e) => {
                      setSelectedInvoice(e.target.value);
                      setCustomInvoiceInput('');
                    }}
                    className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-800"
                  >
                    <option value="">-- Pilih Pesanan dari Daftar --</option>
                    {orders
                      .filter((o) => o.status === 'UNPAID')
                      .map((o) => (
                        <option key={o.invoice_code} value={o.invoice_code}>
                          {o.invoice_code} · {o.items?.[0]?.name || 'Produk'} · {formatRupiah(o.total_amount)} (+{o.customer_phone})
                        </option>
                      ))}
                  </select>
                ) : (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    Tidak ada pesanan UNPAID yang aktif. Anda bisa mengetik kode invoice manual di bawah ini.
                  </p>
                )}
              </div>

              {/* Custom Input Fallback */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Atau Ketik Kode Invoice Manual
                </label>
                <input
                  type="text"
                  placeholder="Contoh: INV-39918243"
                  value={customInvoiceInput}
                  onChange={(e) => {
                    setCustomInvoiceInput(e.target.value);
                    setSelectedInvoice('');
                  }}
                  className="w-full px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-800 font-mono uppercase"
                />
              </div>

              {/* JSON Payload Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preview Payload Webhook yang Dikirimkan:
                </label>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                  <pre>
{JSON.stringify(
  {
    event: 'payment.success',
    invoiceCode: (selectedInvoice || customInvoiceInput || 'INV-XXXXXXXX').toUpperCase(),
    status: 'PAID',
    merchantId: merchantId,
    timestamp: new Date().toISOString(),
  },
  null,
  2
)}
                  </pre>
                </div>
              </div>

              {/* Simulation Result */}
              {simulationResult && (
                <div
                  className={cn(
                    'p-3.5 rounded-xl border text-xs space-y-1.5',
                    simulationResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  )}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {simulationResult.success ? (
                      <>
                        <CheckCircle weight="fill" className="w-4 h-4 text-emerald-600" />
                        <span>Simulasi Berhasil Dieksekusi (HTTP 200 OK)</span>
                      </>
                    ) : (
                      <>
                        <XCircle weight="fill" className="w-4 h-4 text-rose-600" />
                        <span>Simulasi Gagal</span>
                      </>
                    )}
                  </div>
                  <p>{simulationResult.message || simulationResult.error}</p>

                  {simulationResult.success && simulationResult.data && (
                    <div className="pt-2 border-t border-emerald-200/80 space-y-1 text-[11px]">
                      <p>
                        • <strong>Status Pesanan:</strong> {simulationResult.data.updatedOrder?.status || 'PAID'}
                      </p>
                      <p>
                        • <strong>Pembeli (WhatsApp):</strong> +{simulationResult.data.customerPhone}
                      </p>
                      <p>
                        • <strong>Auto-Fulfillment:</strong> Terkirim ke chat pembeli
                      </p>
                      {simulationResult.data.shippingAddress && (
                        <p>
                          • <strong>Alert Owner:</strong> Notifikasi pesanan fisik &amp; alamat dikirim ke Owner WhatsApp
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Trigger Button */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSimulatorOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => handleRunSimulation()}
                  disabled={isSimulating || (!selectedInvoice && !customInvoiceInput)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-900 font-bold rounded-xl text-xs transition shadow-2xs disabled:opacity-50"
                >
                  <Lightning weight="fill" className={cn('w-4 h-4', isSimulating && 'animate-spin')} />
                  <span>{isSimulating ? 'Mengirim Webhook...' : 'Kirim Webhook Pembayaran Sukses'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
