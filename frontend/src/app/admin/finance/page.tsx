'use client';

import React, { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { API_BASE_URL, fetcher } from '@/lib/api';
import {
  ChartLineUp,
  Coins,
  Wallet,
  CalendarBlank,
  TrendUp,
  CircleNotch,
  ShieldWarning,
  Bank,
  Storefront,
  ArrowsClockwise
} from '@phosphor-icons/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

interface FinanceBucket {
  count: number;
  gross: number;
  merchantNet: number;
  dokuFee: number;
  qrisProfit: number;
  withdrawalFees: number;
  totalProfit: number;
}

interface DailyPoint extends FinanceBucket {
  date: string;
}

interface MonthlyPoint extends FinanceBucket {
  month: string;
}

interface MerchantRow {
  id: string;
  businessName: string;
  email: string;
  verificationStatus: string;
  availableBalance: number;
  pendingBalance: number;
  txCount: number;
  gross: number;
  qrisProfit: number;
}

interface FinanceResponse {
  summary: {
    allTime: FinanceBucket;
    thisMonth: FinanceBucket;
    today: FinanceBucket;
    yesterday: FinanceBucket;
  };
  escrow: {
    totalMerchantAvailable: number;
    totalMerchantPending: number;
    pendingWithdrawalsAmount: number;
    pendingWithdrawalsCount: number;
    totalObligation: number;
  };
  dailySeries: DailyPoint[];
  monthlySeries: MonthlyPoint[];
  merchantBreakdown: MerchantRow[];
}

const formatRp = (val: number) => `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(val || 0))}`;

const formatShortRp = (val: number) => {
  if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1).replace('.0', '')}jt`;
  if (val >= 1_000) return `Rp ${Math.round(val / 1_000)}rb`;
  return `Rp ${val}`;
};

const formatDateLabel = (isoDate: string) => {
  const [y, m, d] = isoDate.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${Number(d)} ${months[Number(m) - 1] || m} ${y}`;
};

const formatShortDate = (isoDate: string) => {
  const [, m, d] = isoDate.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${Number(d)} ${months[Number(m) - 1] || m}`;
};

const formatMonthLabel = (ym: string) => {
  const [y, m] = ym.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${months[Number(m) - 1] || m} ${y}`;
};

export default function SuperAdminFinancePage() {
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [timeframe, setTimeframe] = useState<'daily' | 'monthly'>('daily');
  const [metric, setMetric] = useState<'totalProfit' | 'gross'>('totalProfit');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('kitapay_admin_session');
      if (raw) {
        const sess = JSON.parse(raw);
        setIsSuperAdmin(sess.role === 'SUPER_ADMIN');
        return;
      }
    } catch {}
    setIsSuperAdmin(false);
  }, []);

  const { data, isLoading, mutate, isValidating } = useSWR<FinanceResponse>(
    isSuperAdmin ? `${API_BASE_URL}/admin/finance` : null,
    fetcher,
    { refreshInterval: 15000 }
  );

  const chartSeries = useMemo(() => {
    if (!data) return [];
    if (timeframe === 'daily') {
      return data.dailySeries.map((d) => ({
        ...d,
        key: d.date,
        shortLabel: formatShortDate(d.date),
        fullLabel: formatDateLabel(d.date)
      }));
    }
    return data.monthlySeries.map((m) => ({
      ...m,
      key: m.month,
      shortLabel: formatMonthLabel(m.month),
      fullLabel: formatMonthLabel(m.month)
    }));
  }, [data, timeframe]);

  const maxChartVal = useMemo(() => {
    if (chartSeries.length === 0) return 10000;
    const rawMax = Math.max(...chartSeries.map((item) => item[metric] || 0), 1000);
    return Math.ceil(rawMax * 1.15);
  }, [chartSeries, metric]);

  if (isSuperAdmin === null) return null;

  if (!isSuperAdmin) {
    return (
      <div className="max-w-lg mx-auto mt-16 bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-sm">
        <ShieldWarning weight="fill" className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Akses Khusus Super Admin</h2>
        <p className="text-sm text-slate-500 mt-1">
          Halaman laporan keuangan dan profit platform hanya dapat diakses oleh akun Super Admin.
        </p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="text-center py-24 text-slate-500 flex items-center justify-center gap-2">
        <CircleNotch weight="bold" className="animate-spin w-5 h-5 text-emerald-600" />
        <span className="font-semibold text-sm">Menghitung data keuangan &amp; keuntungan KitaPay...</span>
      </div>
    );
  }

  const { summary, escrow, dailySeries, merchantBreakdown } = data;
  const activePoint = hoveredIdx !== null && chartSeries[hoveredIdx] ? chartSeries[hoveredIdx] : chartSeries[chartSeries.length - 1];

  const svgWidth = 860;
  const svgHeight = 270;
  const padLeft = 64;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 34;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold mb-2">
            <ChartLineUp weight="bold" className="w-3.5 h-3.5" />
            <span>Super Admin Financial Analytics</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Keuangan &amp; Keuntungan KitaPay</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Perhitungan margin aktual (Fee Rp 1.500 &minus; Modal DOKU Rp 555 = <strong>Rp 945/tx</strong>) + Fee Penarikan Instan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => mutate()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition cursor-pointer self-start md:self-auto"
        >
          <ArrowsClockwise weight="bold" className={cn('w-4 h-4', isValidating && 'animate-spin text-emerald-600')} />
          <span>Perbarui Data</span>
        </button>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Total Profit All Time */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300">Total Profit Bersih (All Time)</span>
            <Coins weight="fill" className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-black mt-2 tracking-tight">{formatRp(summary.allTime.totalProfit)}</p>
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
            <span>QRIS: {formatRp(summary.allTime.qrisProfit)}</span>
            <span>WD: {formatRp(summary.allTime.withdrawalFees)}</span>
          </div>
        </div>

        {/* Card 2: Profit Bulan Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Profit Bulan Ini</span>
            <CalendarBlank weight="fill" className="w-5 h-5 text-cyan-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 tracking-tight">{formatRp(summary.thisMonth.totalProfit)}</p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>{summary.thisMonth.count} tx sukses</span>
            <span className="font-semibold text-emerald-600">Omzet {formatShortRp(summary.thisMonth.gross)}</span>
          </div>
        </div>

        {/* Card 3: Profit Hari Ini & Kemarin */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Profit Hari Ini</span>
            <TrendUp weight="bold" className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2 tracking-tight">{formatRp(summary.today.totalProfit)}</p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Hari ini: {summary.today.count} tx</span>
            <span>Kemarin: <strong className="text-slate-700">{formatRp(summary.yesterday.totalProfit)}</strong></span>
          </div>
        </div>

        {/* Card 4: Escrow Obligation */}
        <div className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Kewajiban Saldo Merchant</span>
            <Wallet weight="fill" className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 tracking-tight">{formatRp(escrow.totalObligation)}</p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
            <span>Aktif: <strong className="text-slate-700">{formatShortRp(escrow.totalMerchantAvailable)}</strong></span>
            <span>H+1: <strong className="text-slate-700">{formatShortRp(escrow.totalMerchantPending)}</strong></span>
            {escrow.pendingWithdrawalsAmount > 0 && (
              <span>Antre WD: <strong className="text-rose-600">{formatShortRp(escrow.pendingWithdrawalsAmount)}</strong></span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Chart Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Grafik {metric === 'totalProfit' ? 'Keuntungan Bersih KitaPay' : 'Omzet Kotor (Gross)'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Arahkan kursor ke batang grafik untuk melihat rincian omzet, potongan DOKU, dan profit bersih per periode.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Toggle */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setMetric('totalProfit')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer',
                  metric === 'totalProfit' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Profit Bersih
              </button>
              <button
                type="button"
                onClick={() => setMetric('gross')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer',
                  metric === 'gross' ? 'bg-white text-cyan-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Omzet Kotor
              </button>
            </div>

            {/* Timeframe Toggle */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => { setTimeframe('daily'); setHoveredIdx(null); }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer',
                  timeframe === 'daily' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Harian (30 Hari)
              </button>
              <button
                type="button"
                onClick={() => { setTimeframe('monthly'); setHoveredIdx(null); }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer',
                  timeframe === 'monthly' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                Bulanan
              </button>
            </div>
          </div>
        </div>

        {/* Highlight Banner for Active/Hovered Bar */}
        {activePoint && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Periode</span>
              <p className="font-bold text-slate-900 mt-0.5">{activePoint.fullLabel}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Transaksi</span>
              <p className="font-bold text-slate-900 mt-0.5">{activePoint.count} sukses</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Omzet Kotor</span>
              <p className="font-bold text-slate-900 mt-0.5">{formatRp(activePoint.gross)}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Potongan DOKU</span>
              <p className="font-bold text-rose-600 mt-0.5">-{formatRp(activePoint.dokuFee)}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Untung QRIS + WD</span>
              <p className="font-bold text-slate-800 mt-0.5">
                {formatRp(activePoint.qrisProfit)} + {formatRp(activePoint.withdrawalFees)}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Total Profit Bersih</span>
              <p className="font-black text-emerald-600 mt-0.5">{formatRp(activePoint.totalProfit)}</p>
            </div>
          </div>
        )}

        {/* Responsive SVG Bar Chart */}
        {chartSeries.length === 0 ? (
          <div className="py-14 text-center text-xs text-slate-400">Belum ada transaksi sukses pada periode ini.</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full min-w-[620px] h-auto select-none">
              <defs>
                <linearGradient id="profitBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="grossBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines & Y-Axis Labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = padTop + plotH * (1 - ratio);
                const val = Math.round(maxChartVal * ratio);
                return (
                  <g key={ratio}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={svgWidth - padRight}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray={ratio === 0 ? undefined : '4 4'}
                    />
                    <text
                      x={padLeft - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-slate-400 text-[10px] font-medium"
                    >
                      {formatShortRp(val)}
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {chartSeries.map((pt, idx) => {
                const slotW = plotW / chartSeries.length;
                const barW = Math.min(36, Math.max(8, slotW * 0.62));
                const x = padLeft + idx * slotW + (slotW - barW) / 2;
                const val = pt[metric] || 0;
                const barH = Math.max(val > 0 ? 4 : 0, (val / maxChartVal) * plotH);
                const y = padTop + plotH - barH;
                const isHovered = hoveredIdx === idx || (hoveredIdx === null && idx === chartSeries.length - 1);
                const showLabel =
                  chartSeries.length <= 12 ||
                  idx === 0 ||
                  idx === chartSeries.length - 1 ||
                  idx % Math.ceil(chartSeries.length / 8) === 0;

                return (
                  <g
                    key={pt.key}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className="cursor-pointer"
                  >
                    {/* Invisible hover hit target */}
                    <rect
                      x={padLeft + idx * slotW}
                      y={padTop}
                      width={slotW}
                      height={plotH + padBottom}
                      fill={isHovered ? 'rgba(15, 23, 42, 0.03)' : 'transparent'}
                      rx={6}
                    />
                    <rect
                      x={x}
                      y={y}
                      width={barW}
                      height={barH}
                      rx={Math.min(6, barW / 2)}
                      fill={metric === 'totalProfit' ? 'url(#profitBarGrad)' : 'url(#grossBarGrad)'}
                      opacity={hoveredIdx === null || isHovered ? 1 : 0.45}
                    />
                    {showLabel && (
                      <text
                        x={padLeft + idx * slotW + slotW / 2}
                        y={svgHeight - 10}
                        textAnchor="middle"
                        className={cn(
                          'text-[10px]',
                          isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-400 font-medium'
                        )}
                      >
                        {pt.shortLabel}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Bottom 2-Column Tables: Daily Financial Breakdown + Per-Merchant Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Daily Breakdown Table (2/3 width) */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bank weight="fill" className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Rincian Keuangan Harian (30 Hari Terakhir)</h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Urutan terbaru di atas</span>
          </div>
          <div className="overflow-x-auto max-h-[420px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0">
                <tr>
                  <th className="py-3 px-4 font-bold">Tanggal (WIB)</th>
                  <th className="py-3 px-3 font-bold text-center">Tx</th>
                  <th className="py-3 px-3 font-bold text-right">Omzet Kotor</th>
                  <th className="py-3 px-3 font-bold text-right">Hak Merchant</th>
                  <th className="py-3 px-3 font-bold text-right">Modal DOKU</th>
                  <th className="py-3 px-3 font-bold text-right">Untung QRIS</th>
                  <th className="py-3 px-3 font-bold text-right">Fee WD</th>
                  <th className="py-3 px-4 font-bold text-right text-emerald-700">Total Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...dailySeries].reverse().map((row) => (
                  <tr key={row.date} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-800 whitespace-nowrap">{formatDateLabel(row.date)}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600">{row.count}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">{formatRp(row.gross)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatRp(row.merchantNet)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-600">-{formatRp(row.dokuFee)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-800">{formatRp(row.qrisProfit)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-700">{formatRp(row.withdrawalFees)}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600">{formatRp(row.totalProfit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Merchant Breakdown & Obligations (1/3 width) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <Storefront weight="fill" className="w-5 h-5 text-cyan-600" />
            <h3 className="text-sm font-bold text-slate-900">Saldo &amp; Profit per Merchant</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
            {merchantBreakdown.map((m) => (
              <div key={m.id} className="p-4 space-y-2 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{m.businessName}</p>
                    <p className="text-[11px] text-slate-500">{m.email}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold shrink-0">
                    +{formatRp(m.qrisProfit)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <span className="text-slate-400 block text-[10px]">Saldo Aktif</span>
                    <span className="font-bold text-slate-800">{formatRp(m.availableBalance)}</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <span className="text-slate-400 block text-[10px]">Tertunda H+1</span>
                    <span className="font-bold text-amber-700">{formatRp(m.pendingBalance)}</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <span className="text-slate-400 block text-[10px]">Omzet ({m.txCount} tx)</span>
                    <span className="font-bold text-slate-800">{formatShortRp(m.gross)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
