import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const TOPICS = [
  {
    id: 'dlmm',
    title: 'Apa itu DLMM?',
    icon: '🎯',
    content: `**Dynamic Liquidity Market Maker (DLMM)** adalah protokol liquidity di Meteora yang menggunakan sistem **bin** untuk concentrated liquidity.

**Cara kerja:**
- Harga dibagi ke dalam "bins" (slot harga)
- Kamu pilih range harga untuk deposit likuiditas
- Semakin sempit range = semakin tinggi fee yang didapat
- Tapi risiko out-of-range juga lebih besar

**Strategi DLMM:**
- **Spot** — Range sangat sempit di sekitar harga saat ini. Fee tinggi, risiko tinggi.
- **Curve** — Range medium, cocok untuk pair yang stabil. Balance antara fee dan risiko.
- **Bid-Ask** — Range lebar, mirip order book. Fee lebih rendah tapi lebih aman.`,
  },
  {
    id: 'damm',
    title: 'Apa itu DAMM?',
    icon: '🌊',
    content: `**Dynamic AMM (DAMM)** adalah versi automated dari liquidity providing di Meteora.

**Perbedaan dengan DLMM:**
- Likuiditas tersebar di **seluruh range harga** (full range)
- Tidak perlu memilih range secara manual
- Fee lebih rendah dibanding DLMM concentrated
- Tapi **lebih aman** karena tidak pernah out-of-range

**Cocok untuk:**
- Pemula yang baru mulai LP
- Pair dengan volatilitas tinggi
- Yang tidak mau monitor posisi terus-menerus`,
  },
  {
    id: 'il',
    title: 'Impermanent Loss (IL)',
    icon: '📉',
    content: `**Impermanent Loss** adalah kerugian yang terjadi saat harga token berubah dibanding saat kamu deposit.

**Kenapa terjadi?**
- AMM otomatis rebalance posisi kamu
- Jika harga naik, kamu jual token yang naik (dan sebaliknya)
- Hasilnya kamu punya lebih sedikit token yang naik harganya

**Seberapa besar IL?**
- Harga berubah ±25% → IL sekitar 0.6%
- Harga berubah ±50% → IL sekitar 2.0%
- Harga berubah ±75% → IL sekitar 3.8%
- Harga 2x lipat → IL sekitar 5.7%

**Tips:** IL disebut "impermanent" karena jika harga kembali ke titik awal, IL hilang. Tapi jika kamu withdraw saat harga berbeda, IL menjadi permanent.`,
  },
  {
    id: 'fees',
    title: 'Fee & Yield',
    icon: '💰',
    content: `**Fee** adalah pendapatan yang didapat LP dari setiap trade yang terjadi di pool.

**Faktor yang mempengaruhi fee:**
- **Trading Volume** — Semakin tinggi volume, semakin banyak fee
- **Fee Rate** — Persentase yang diambil dari setiap trade
- **TVL** — Total Value Locked, semakin kecil TVL = share kamu lebih besar
- **Concentration** — Di DLMM, range sempit = fee lebih besar (tapi risiko lebih tinggi)

**Metrik penting:**
- **Daily Yield** = Fee 24h / TVL × 100%
- **APR** = Daily Yield × 365
- **Vol/TVL ratio** — Semakin tinggi = semakin bagus untuk LP

**Tips:** Pool dengan volume tinggi tapi TVL rendah biasanya memberikan yield terbaik.`,
  },
  {
    id: 'roi',
    title: 'Menghitung ROI',
    icon: '📊',
    content: `**ROI (Return on Investment)** untuk LP dihitung dari fee dikurangi IL.

**Formula:**
- Net Profit = Fee Earned - IL Loss
- ROI (%) = (Net Profit / Capital) × 100

**Contoh:**
- Capital: $1,000
- Fee 7 hari: $50
- IL 7 hari: $20
- Net profit: $30
- Weekly ROI: 3%

**Break-even:** Berapa lama fee bisa menutupi IL. Jika break-even terlalu lama, mungkin pool tersebut kurang menguntungkan.

**Tips:** Gunakan calculator untuk simulasi berbagai skenario sebelum deposit!`,
  },
  {
    id: 'strategy',
    title: 'Tips & Strategi',
    icon: '🧠',
    content: `**Untuk Pemula:**
1. Mulai dengan modal kecil yang kamu siap kehilangan
2. Pilih pair stablecoin (USDC/USDT) untuk belajar tanpa IL besar
3. Gunakan DAMM untuk pengalaman pertama
4. Pahami IL sebelum pindah ke DLMM

**Untuk Intermediate:**
1. Coba DLMM dengan strategi Curve
2. Monitor posisi setiap hari
3. Rebalance jika harga mendekati batas range
4. Diversifikasi ke beberapa pool

**Risk Management:**
- Jangan taruh semua modal di satu pool
- Fee tinggi = risiko tinggi (biasanya)
- Perhatikan Vol/TVL ratio, bukan hanya APR
- Set alert harga untuk rebalance

**Red Flags:**
- APR > 500% biasanya tidak sustainable
- TVL sangat kecil (< $10K) = likuiditas tipis
- Volume turun drastis = fee turun juga`,
  },
];

function TopicCard({ topic }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-600 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 text-left flex items-center gap-3"
      >
        <span className="text-2xl">{topic.icon}</span>
        <span className="flex-1 font-semibold text-gray-900 dark:text-white">
          {topic.title}
        </span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-slate-700 pt-3">
          <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {topic.content.split(/(\*\*.*?\*\*)/).map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <span key={i} className="font-bold text-gray-900 dark:text-white">
                    {part.slice(2, -2)}
                  </span>
                );
              }
              return <span key={i}>{part}</span>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LearnView() {
  return (
    <div className="p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold dark:text-white text-gray-900">Belajar LP</h2>
          <p className="dark:text-gray-400 text-gray-600 text-sm">
            Panduan liquidity providing di Meteora
          </p>
        </div>

        <div className="space-y-3">
          {TOPICS.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </div>

        <div className="mt-6 bg-purple-50 dark:bg-purple-950 rounded-xl border border-purple-200 dark:border-purple-800 p-4 text-center">
          <p className="text-sm text-purple-800 dark:text-purple-300 font-medium mb-1">
            Ingin belajar lebih lanjut?
          </p>
          <a
            href="https://docs.meteora.ag"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-purple-600 dark:text-purple-400 underline hover:no-underline"
          >
            Baca Meteora Official Docs
          </a>
        </div>

        <div className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
          Konten edukasi ini bukan financial advice. DYOR!
        </div>
      </div>
    </div>
  );
}
