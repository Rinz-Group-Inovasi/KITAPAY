'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { API_BASE_URL, getClientMerchantId } from '@/lib/api';
import useSWR from 'swr';
import { Headset, PaperPlaneRight, Ticket, Plus, CheckCircle, Clock } from '@phosphor-icons/react';
import { useToast } from '@/components/ToastProvider';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SupportPage() {
  const { user } = useAuth();
  const toast = useToast();
  const merchantId = user ? getClientMerchantId(user.id) : null;
  const { data, isLoading, mutate } = useSWR(merchantId ? `${API_BASE_URL}/support/merchant/${merchantId}` : null, fetcher);
  
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [subject, setSubject] = useState('');
  const [initialMessage, setInitialMessage] = useState('');

  const tickets = data?.tickets || [];

  // Update active ticket when data refreshes
  useEffect(() => {
    if (activeTicket && tickets.length > 0) {
      const updated = tickets.find((t: any) => t.id === activeTicket.id);
      if (updated) setActiveTicket(updated);
    }
  }, [data]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/support/merchant/${merchantId}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message: initialMessage })
      });
      if (res.ok) {
        toast.success('Tiket support berhasil dibuat.');
        setSubject('');
        setInitialMessage('');
        setIsCreating(false);
        mutate();
      } else {
        throw new Error('Gagal membuat tiket');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat membuat tiket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !newMessage.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/support/${activeTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'MERCHANT', message: newMessage })
      });
      if (res.ok) {
        setNewMessage('');
        mutate();
      } else {
        throw new Error('Gagal mengirim pesan');
      }
    } catch (err) {
      toast.error('Gagal mengirim pesan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-slate-500">Memuat tiket...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Headset weight="duotone" className="w-6 h-6 text-[#00DDFD]" />
            Pusat Bantuan
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Hubungi tim Support kami untuk mendapatkan bantuan teknis maupun kendala transaksi.</p>
        </div>
        {!isCreating && (
          <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 bg-[#00DDFD] text-slate-900 font-bold px-4 py-2.5 rounded-xl hover:bg-[#00c5e3] transition-colors shadow-sm">
            <Plus weight="bold" className="w-4 h-4" /> Tiket Baru
          </button>
        )}
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg text-slate-800">Buat Tiket Baru</h2>
            <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-600 text-sm font-semibold">Batal</button>
          </div>
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-black mb-1">Subjek Masalah</label>
              <input required value={subject} onChange={e => setSubject(e.target.value)} type="text" placeholder="Contoh: Gagal penarikan dana" className="w-full p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#00DDFD] focus:ring-1 focus:ring-[#00DDFD] font-medium text-slate-900 bg-white" />
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-1">Detail Masalah</label>
              <textarea required value={initialMessage} onChange={e => setInitialMessage(e.target.value)} placeholder="Jelaskan kendala Anda secara detail..." rows={4} className="w-full p-3 rounded-xl border border-slate-300 focus:outline-none focus:border-[#00DDFD] focus:ring-1 focus:ring-[#00DDFD] font-medium text-slate-900 bg-white"></textarea>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50">
              {isSubmitting ? 'Memproses...' : 'Kirim Tiket'}
            </button>
          </form>
        </div>
      )}

      {!isCreating && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tiket List */}
          <div className="md:col-span-1 space-y-3">
            {tickets.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-2xl border border-slate-200">
                <Ticket weight="duotone" className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Belum ada tiket support.</p>
              </div>
            ) : (
              tickets.map((ticket: any) => (
                <button 
                  key={ticket.id} 
                  onClick={() => setActiveTicket(ticket)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${activeTicket?.id === ticket.id ? 'bg-[#00DDFD]/10 border-[#00DDFD] ring-1 ring-[#00DDFD]' : 'bg-white border-slate-200 hover:border-[#00DDFD]/50'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-800 truncate pr-2">{ticket.payload.subject}</h3>
                    {ticket.status === 'CLOSED' ? (
                      <span className="shrink-0 bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">Selesai</span>
                    ) : ticket.status === 'ANSWERED' ? (
                      <span className="shrink-0 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Dibalas</span>
                    ) : (
                      <span className="shrink-0 bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Menunggu</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{ticket.payload.messages[ticket.payload.messages.length - 1]?.text}</p>
                </button>
              ))
            )}
          </div>

          {/* Chat Window */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[600px] overflow-hidden">
            {activeTicket ? (
              <>
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <div>
                    <h2 className="font-bold text-slate-800">{activeTicket.payload.subject}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Tiket ID: {activeTicket.id.split('-')[0]}</p>
                  </div>
                  {activeTicket.status === 'CLOSED' && (
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-200 px-3 py-1 rounded-full">
                      <CheckCircle weight="fill" /> Tiket Selesai
                    </div>
                  )}
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
                  {activeTicket.payload.messages.map((msg: any, i: number) => (
                    <div key={i} className={`flex flex-col max-w-[80%] ${msg.sender === 'MERCHANT' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                      <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1">{msg.sender === 'MERCHANT' ? 'Anda' : 'CS KitaPay'}</span>
                      <div className={`p-3 rounded-2xl text-sm ${msg.sender === 'MERCHANT' ? 'bg-slate-900 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
                {activeTicket.status !== 'CLOSED' ? (
                  <form onSubmit={handleReply} className="p-4 border-t border-slate-100 bg-white">
                    <div className="flex gap-2">
                      <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Ketik balasan Anda..." className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-[#00DDFD] focus:ring-1 focus:ring-[#00DDFD] rounded-xl px-4 py-3 text-sm font-medium text-slate-900" />
                      <button type="submit" disabled={!newMessage.trim() || isSubmitting} className="bg-[#00DDFD] text-slate-900 p-3 rounded-xl hover:bg-[#00c5e3] transition-colors disabled:opacity-50">
                        <PaperPlaneRight weight="fill" className="w-5 h-5" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 border-t border-slate-100 bg-slate-50 text-center text-sm font-semibold text-slate-500">
                    Tiket ini telah ditutup. Silakan buat tiket baru jika ada kendala lain.
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <Headset weight="duotone" className="w-16 h-16 mb-4 text-slate-200" />
                <p className="font-semibold text-slate-500">Pilih tiket di samping</p>
                <p className="text-sm mt-1">Atau buat tiket baru untuk memulai percakapan dengan tim Support kami.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
