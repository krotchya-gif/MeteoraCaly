require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://meteora-caly.vercel.app';
const API_URL = process.env.API_URL || 'https://meteora-calculator-api.infocyber001.workers.dev';

if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN is required! Add it to .env file');
}

const bot = new Telegraf(BOT_TOKEN);

// ============================================
// HELPERS
// ============================================

async function fetchTopPools(limit = 10) {
  try {
    const res = await fetch(`${API_URL}/api/pools/top/${limit}`);
    const data = await res.json();
    if (data.success && data.data?.pools?.length > 0) {
      return data.data.pools;
    }
  } catch (e) {
    console.error('Failed to fetch pools:', e.message);
  }
  return null;
}

function formatNumber(num) {
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
  return `$${num.toFixed(0)}`;
}

function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

// ============================================
// COMMANDS
// ============================================

bot.command('start', (ctx) => {
  ctx.replyWithMarkdown(
`🧮 *Welcome to Meteora Calculator\\!*

Hitung potensi return dari DLMM & DAMM liquidity pools di Solana\\.

*Features:*
✅ 50\\+ pools \\(live data\\)
✅ DLMM & DAMM analysis
✅ IL & Fee calculation
✅ Strategy comparison
✅ Dark/Light theme

*Commands:*
/calc \\- Open calculator
/top \\- Top 10 pools by volume
/pools \\- Search pools
/learn \\- Educational content
/help \\- How to use

_Not financial advice\\. DYOR\\!_`,
    {
      parse_mode: 'MarkdownV2',
      ...Markup.keyboard([
        [Markup.button.webApp('🧮 Open Calculator', MINI_APP_URL)],
        ['/top', '/learn'],
        ['/help']
      ]).resize()
    }
  );
});

bot.command('calc', (ctx) => {
  ctx.reply(
    '🧮 Klik tombol di bawah untuk buka calculator:',
    Markup.inlineKeyboard([
      [Markup.button.webApp('🧮 Open Calculator', MINI_APP_URL)]
    ])
  );
});

// Alias
bot.command('calculate', (ctx) => ctx.scene?.enter?.('calc') || ctx.reply(
  '🧮 Klik tombol di bawah untuk buka calculator:',
  Markup.inlineKeyboard([
    [Markup.button.webApp('🧮 Open Calculator', MINI_APP_URL)]
  ])
));

bot.command('top', async (ctx) => {
  await ctx.reply('⏳ Fetching top pools...');

  const pools = await fetchTopPools(10);
  if (!pools) {
    return ctx.reply('❌ Gagal fetch data pools. Coba lagi nanti.');
  }

  let msg = '📊 *Top 10 Pools by Volume*\n\n';
  pools.forEach((pool, i) => {
    const rank = i + 1;
    const pair = escapeMarkdown(pool.pair);
    const tvl = escapeMarkdown(formatNumber(pool.tvl));
    const vol = escapeMarkdown(formatNumber(pool.volume_24h));
    const fee = escapeMarkdown(formatNumber(pool.fees_24h));
    const dy = escapeMarkdown(pool.daily_yield.toFixed(2));
    msg += `*${rank}\\. ${pair}*\n`;
    msg += `   TVL: ${tvl} \\| Vol: ${vol}\n`;
    msg += `   Fee 24h: ${fee} \\| Yield: ${dy}%\n\n`;
  });

  msg += `_Data live dari Meteora API_\n`;
  msg += `_Updated: ${escapeMarkdown(new Date().toLocaleString('id-ID'))}_`;

  ctx.replyWithMarkdownV2(msg,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🧮 Analyze di Calculator', MINI_APP_URL)]
    ])
  );
});

bot.command('pools', async (ctx) => {
  const query = ctx.message.text.split(' ').slice(1).join(' ').trim();

  if (!query) {
    return ctx.replyWithMarkdown(
      '🔍 *Search Pools*\n\nGunakan: `/pools <keyword>`\n\nContoh:\n• `/pools SOL`\n• `/pools USDC`\n• `/pools JUP`\n\nAtau gunakan /top untuk lihat top 10 pools.',
      Markup.inlineKeyboard([
        [Markup.button.webApp('📊 Open Calculator', MINI_APP_URL)]
      ])
    );
  }

  await ctx.reply(`⏳ Searching "${query}"...`);

  try {
    const res = await fetch(`${API_URL}/api/pools/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!data.success || !data.data?.pools?.length) {
      return ctx.reply(`❌ Pool "${query}" tidak ditemukan. Coba keyword lain.`);
    }

    const pools = data.data.pools.slice(0, 5);
    let msg = `🔍 *Results for "${escapeMarkdown(query)}"*\n\n`;

    pools.forEach((pool, i) => {
      const pair = escapeMarkdown(pool.pair);
      const tvl = escapeMarkdown(formatNumber(pool.tvl));
      const vol = escapeMarkdown(formatNumber(pool.volume_24h));
      const fee = escapeMarkdown(formatNumber(pool.fees_24h));
      msg += `*${i + 1}\\. ${pair}*\n`;
      msg += `   TVL: ${tvl} \\| Vol: ${vol} \\| Fee: ${fee}\n\n`;
    });

    if (data.data.count > 5) {
      msg += `_\\.\\.\\. dan ${data.data.count - 5} pool lainnya_\n`;
    }

    ctx.replyWithMarkdownV2(msg,
      Markup.inlineKeyboard([
        [Markup.button.webApp('🧮 Open Calculator', MINI_APP_URL)]
      ])
    );
  } catch (e) {
    console.error('Search error:', e.message);
    ctx.reply('❌ Error searching pools. Coba lagi.');
  }
});

bot.command('learn', (ctx) => {
  ctx.replyWithMarkdown(
`📚 *Belajar Liquidity Providing*

*Apa itu DLMM?*
Dynamic Liquidity Market Maker - concentrated liquidity dalam bins. Kamu pilih price range.

*Apa itu DAMM?*
Dynamic AMM - full range liquidity dengan auto-adjustment berdasarkan volatilitas.

*Key Concepts:*
• *IL (Impermanent Loss):* Kerugian vs holding aset
• *Fee Income:* Didapat dari trading volume
• *ROI:* Fee income dikurangi IL
• *Strategy:*
  - Spot (tight range, fee tinggi, risiko tinggi)
  - Curve (medium range, balanced)
  - Bid-Ask (wide range, fee rendah, risiko rendah)

*Tips Pemula:*
💡 Mulai dengan modal kecil
💡 Pahami IL sebelum mulai
💡 Fee tinggi = risiko tinggi
💡 DAMM lebih aman dari DLMM

*Resources:*
📖 [Meteora Docs](https://docs.meteora.ag)

Coba calculator: /calc`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🧮 Coba Calculator', MINI_APP_URL)]
    ])
  );
});

bot.command('help', (ctx) => {
  ctx.replyWithMarkdown(
`❓ *Cara Menggunakan Meteora Calculator*

*Step 1:* Buka calculator
/calc atau klik tombol di bawah

*Step 2:* Pilih pool
Pilih dari 50+ pool yang tersedia (live data)

*Step 3:* Masukkan capital
Berapa USD yang ingin kamu sediakan

*Step 4:* Pilih strategy
• DLMM: Spot, Curve, atau Bid-Ask
• DAMM: Full range (otomatis)

*Step 5:* Lihat hasil
Fee projections, IL, dan ROI

*Commands:*
/calc - Buka calculator
/top - Top 10 pools
/pools <keyword> - Cari pool
/learn - Edukasi LP
/about - Info bot

_Disclaimer: Not financial advice_`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🧮 Open Calculator', MINI_APP_URL)]
    ])
  );
});

bot.command('about', (ctx) => {
  ctx.replyWithMarkdown(
`ℹ️ *About Meteora Calculator*

Version: 1.0.0
Project: [MeteoraCaly](https://github.com/krotchya-gif/MeteoraCaly)

*Tech Stack:*
• Frontend: React + Vite + Tailwind CSS
• Backend: Cloudflare Workers + KV
• Bot: Node.js + Telegraf
• Data: Meteora DLMM API (live)

*Features:*
✅ 50+ pools (live data)
✅ DLMM & DAMM calculations
✅ IL, Fee & ROI projections
✅ Strategy comparison
✅ Dark/Light theme
✅ Export CSV

_Built for DeFi community_`,
    Markup.inlineKeyboard([
      [Markup.button.url('⭐ GitHub', 'https://github.com/krotchya-gif/MeteoraCaly')]
    ])
  );
});

// ============================================
// WEB APP DATA HANDLER
// ============================================

bot.on('web_app_data', (ctx) => {
  try {
    const data = JSON.parse(ctx.webAppData.data);

    if (data.action === 'calculation_complete') {
      const msg = `
✅ *Calculation Result*

*Pool:* ${data.pool}
*Capital:* $${data.capital}
*Strategy:* ${data.strategy}
*Daily Fee:* $${data.dailyFee?.toFixed(2) || '0.00'}
*Weekly ROI:* ${data.weeklyROI > 0 ? '+' : ''}${data.weeklyROI?.toFixed(2) || '0.00'}%
*IL:* ${data.ilPercent?.toFixed(2) || '0.00'}%

_Projection only. Actual results may vary._

/calc untuk hitung lagi`;

      ctx.replyWithMarkdown(msg);
    } else {
      ctx.reply('✅ Data diterima dari calculator.');
    }
  } catch (error) {
    console.error('Error parsing web app data:', error);
    ctx.reply('❌ Error processing data. Coba lagi.');
  }
});

// ============================================
// INLINE QUERIES
// ============================================

bot.on('inline_query', (ctx) => {
  ctx.answerInlineQuery([
    {
      type: 'article',
      id: '1',
      title: '🧮 Meteora DLMM Calculator',
      description: 'Hitung return LP di Meteora - 50+ pools live data',
      input_message_content: {
        message_text: '🧮 *Meteora Calculator*\n\nHitung potensi return DLMM & DAMM liquidity pools\\!\n\n50\\+ pools dengan live data dari Meteora API\\.',
        parse_mode: 'MarkdownV2'
      },
      reply_markup: {
        inline_keyboard: [[{ text: '🧮 Open Calculator', web_app: { url: MINI_APP_URL } }]]
      }
    }
  ]);
});

// ============================================
// ERROR & CATCH-ALL
// ============================================

bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
});

bot.on('text', (ctx) => {
  const text = ctx.message.text.toLowerCase();

  if (text.includes('help') || text.includes('bantuan')) {
    return ctx.reply('Gunakan /help untuk melihat semua commands');
  }
  if (text.includes('pool') || text.includes('list')) {
    return ctx.reply('Gunakan /top untuk top pools atau /pools <keyword> untuk search');
  }
  if (text.includes('calc') || text.includes('hitung')) {
    return ctx.reply('Gunakan /calc untuk buka calculator');
  }

  ctx.reply(
    'Hai! Saya Meteora Calculator Bot 🧮\n\nGunakan /start untuk lihat semua fitur.',
    Markup.inlineKeyboard([
      [Markup.button.webApp('🧮 Open Calculator', MINI_APP_URL)]
    ])
  );
});

// ============================================
// LAUNCH (polling mode)
// ============================================

bot.telegram.getMe().then((botInfo) => {
  bot.botInfo = botInfo;
  console.log(`✅ Bot verified: @${botInfo.username}`);
  console.log(`📱 Mini App URL: ${MINI_APP_URL}`);
  console.log(`🔗 API URL: ${API_URL}`);

  return bot.launch({ dropPendingUpdates: true });
}).then(() => {
  console.log('🚀 Polling started!');
}).catch((err) => {
  console.error('❌ Failed to start bot:', err.message);
  process.exit(1);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = bot;
