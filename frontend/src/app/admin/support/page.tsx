'use client';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/api';
import useSWR from 'swr';
import { Headset, PaperPlaneRight, CheckCircle, Ticket, LockKey } from '@phosphor-icons/react';
import { useToast } from '@/components/ToastProvider';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminSupportPage() {
  const toast = useToast();
  const { data, isLoading, mutate } = useSWR(`${API_BASE_URL}/support/admin/all`, fetcher, { refreshInterval: 5000 });
  
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tickets = data?.tickets || [];

  useEffect(() => {
    if (activeTicket && tickets.length > 0) {
      const updated = tickets.find((t: any) => t.id === activeTicket.id);
      if (updated) setActiveTicket(updated);
    }
  }, [data]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !newMessage.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/support/${activeTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'ADMIN', message: newMessage })
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

  const handleCloseTicket = async () => {
    if (!activeTicket || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/support/admin/${activeTicket.id}/close`, {
        method: 'POST'
      });
      if (res.ok) {
        toast.success('Tiket berhasil ditutup.');
        mutate();
      } else {
        throw new Error('Gagal menutup tiket');
      }
    } catch (err) {
      toast.error('Gagal menutup tiket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Memuat data tiket...</div>;

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Support Tiket (CS)</h1>
        <p className="text-slate-500 mt-1">Balas keluhan dan pertanyaan dari merchant.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Ticket List */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-800">
            Daftar Tiket ({tickets.filter((t:any) => t.status !== 'CLOSED').length} Aktif)
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {tickets.length === 0 ? (
              <div className="text-center p-8 text-slate-400">
                <Ticket className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Tidak ada tiket</p>
              </div>
            ) : (
              tickets.map((ticket: any) => (
                <button 
                  key={ticket.id} 
                  onClick={() => setActiveTicket(ticket)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${activeTicket?.id === ticket.id ? 'bg-[#00DDFD]/10 border-[#00DDFD] ring-1 ring-[#00DDFD]' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h3 className="font-bold text-slate-800 text-sm truncate">{ticket.payload?.subject}</h3>
                    {ticket.status === 'CLOSED' ? (
                      <span className="shrink-0 bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">Selesai</span>
                    ) : ticket.status === 'ANSWERED' ? (
                      <span className="shrink-0 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Dibalas CS</span>
                    ) : (
                      <span className="shrink-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">Perlu Balasan</span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-500 truncate mb-1">{ticket.merchants?.business_name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{ticket.payload?.messages?.[ticket.payload.messages.length - 1]?.text}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {activeTicket ? (
            <>
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-slate-800">{activeTicket.payload?.subject}</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Merchant: {activeTicket.merchants?.business_name} ({activeTicket.merchants?.email})</p>
                </div>
                {activeTicket.status !== 'CLOSED' && (
                  <button onClick={handleCloseTicket} disabled={isSubmitting} className="flex items-center gap-1 text-xs font-bold bg-slate-200 text-slate-700 hover:bg-red-100 hover:text-red-700 px-3 py-1.5 rounded-full transition-colors">
                    <LockKey weight="fill" /> Tutup Tiket
                  </button>
                )}
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/30">
                {activeTicket.payload?.messages?.map((msg: any, i: number) => (
                  <div key={i} className={`flex flex-col max-w-[80%] ${msg.sender === 'ADMIN' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                    <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1">{msg.sender === 'ADMIN' ? 'Anda (CS)' : activeTicket.merchants?.business_name}</span>
                    <div className={`p-3.5 rounded-2xl text-sm ${msg.sender === 'ADMIN' ? 'bg-[#00DDFD] text-slate-900 font-medium rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'}`}>
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
                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Ketik balasan ke merchant..." className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-[#00DDFD] focus:ring-1 focus:ring-[#00DDFD] rounded-xl px-4 py-3 text-sm font-medium text-slate-900 bg-white" />
                    <button type="submit" disabled={!newMessage.trim() || isSubmitting} className="bg-[#00DDFD] text-slate-900 p-3 rounded-xl hover:bg-[#00c5e3] transition-colors disabled:opacity-50">
                      <PaperPlaneRight weight="fill" className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 border-t border-slate-100 bg-slate-50 text-center text-sm font-semibold text-slate-500">
                  Tiket ini telah ditutup. Tidak dapat membalas lagi.
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <Headset weight="duotone" className="w-16 h-16 mb-4 text-slate-200" />
              <p className="font-semibold text-slate-500">Pilih tiket merchant di samping untuk membalas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
