// ============================================
// METEORA DLMM/DAMM CALCULATOR - TELEGRAM BOT
// ============================================

// Package: npm install telegraf dotenv

require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

// Configuration
const BOT_TOKEN = process.env.BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://your-mini-app.vercel.app';

if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN is required! Add it to .env file');
}

// Initialize bot
const bot = new Telegraf(BOT_TOKEN);

// ============================================
// COMMANDS
// ============================================

// /start command
bot.command('start', (ctx) => {
  const welcomeMessage = `
🧮 *Welcome to Meteora Calculator!*

Calculate your potential returns from DLMM & DAMM liquidity pools.

*Features:*
✅ Multi-pairing support
✅ DLMM & DAMM analysis
✅ IL & Fee calculation
✅ ROI projections
✅ Strategy comparison

*Quick Actions:*
• /calculate - Open calculator
• /pools - Browse available pools
• /learn - Educational content
• /help - How to use

_Not financial advice. DYOR!_
  `;

  ctx.replyWithMarkdown(welcomeMessage, 
    Markup.keyboard([
      [Markup.button.webApp('🧮 Open Calculator', MINI_APP_URL)],
      ['/pools', '/learn'],
      ['/help']
    ]).resize()
  );
});

// /calculate command - Open Mini App
bot.command('calculate', (ctx) => {
  ctx.reply(
    '🧮 Click below to open the calculator:',
    Markup.inlineKeyboard([
      [Markup.button.webApp('Open Calculator', MINI_APP_URL)]
    ])
  );
});

// /pools command - List available pools
bot.command('pools', (ctx) => {
  const poolsList = `
📊 *Available Pools*

*DLMM Pools:*
• BFS/SOL
  TVL: $111K | Vol: $11M/day
  Fee: 0.77% | Yield: ~40%/day

• BFS/USDC
  TVL: $143K | Vol: $6M/day
  Fee: 0.80% | Yield: ~28%/day

*More pools coming soon!*

Use /calculate to analyze any pool.
  `;

  ctx.replyWithMarkdown(poolsList,
    Markup.inlineKeyboard([
      [Markup.button.webApp('📊 Open Calculator', MINI_APP_URL)]
    ])
  );
});

// /learn command - Educational content
bot.command('learn', (ctx) => {
  const educationalContent = `
📚 *Learn About Liquidity Providing*

*What is DLMM?*
Dynamic Liquidity Market Maker - concentrated liquidity in bins. You choose price range.

*What is DAMM?*
Dynamic AMM - full range liquidity with auto-adjustment based on volatility.

*Key Concepts:*
• *IL (Impermanent Loss):* Loss vs holding assets
• *Fee Income:* Earned from trading volume
• *ROI:* Fee income minus IL
• *Strategy:* Spot (tight), Curve (medium), Bid-Ask (wide)

*Resources:*
📖 [Meteora Docs](https://docs.meteora.ag)
🎓 [DeFi Education](https://defieducation.com)

Use /calculate to try it out!
  `;

  ctx.replyWithMarkdown(educationalContent,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🧮 Try Calculator', MINI_APP_URL)]
    ])
  );
});

// /help command
bot.command('help', (ctx) => {
  const helpMessage = `
❓ *How to Use Meteora Calculator*

*Step 1:* Open calculator
/calculate or click button below

*Step 2:* Select pool
Choose from BFS/SOL, BFS/USDC, etc.

*Step 3:* Enter capital
How much USD you want to provide

*Step 4:* Choose strategy
• DLMM: Spot, Curve, or Bid-Ask
• DAMM: Full range (automatic)

*Step 5:* View results
See fee projections, IL, and ROI

*Tips:*
💡 Start with small amounts
💡 Understand IL before starting
💡 Higher fees = higher risk
💡 DAMM is safer than DLMM

*Questions?*
Contact: @YourSupportUsername

_Disclaimer: Not financial advice_
  `;

  ctx.replyWithMarkdown(helpMessage,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🧮 Open Calculator', MINI_APP_URL)]
    ])
  );
});

// /about command
bot.command('about', (ctx) => {
  const aboutMessage = `
ℹ️ *About Meteora Calculator*

Version: 1.0.0
Developer: @YourUsername
Project: Open Source

*Tech Stack:*
• Frontend: React + Vite + Tailwind
• Bot: Node.js + Telegraf
• Hosting: Vercel + Railway

*Features:*
✅ 2+ pools supported
✅ DLMM & DAMM calculations
✅ Real-time projections
✅ Mobile-optimized

*Coming Soon:*
🔜 More pools
🔜 Real-time API
🔜 Portfolio tracker
🔜 Notifications

*Support Development:*
⭐ Star on GitHub
💬 Share with friends
☕ Buy me a coffee

_Built with ❤️ for DeFi community_
  `;

  ctx.replyWithMarkdown(aboutMessage,
    Markup.inlineKeyboard([
      [Markup.button.url('⭐ GitHub', 'https://github.com/yourusername/meteora-calc')],
      [Markup.button.url('☕ Donate', 'https://buymeacoffee.com/yourusername')]
    ])
  );
});

// ============================================
// WEB APP DATA HANDLER
// ============================================

// When user sends data from Mini App back to bot
bot.on('web_app_data', (ctx) => {
  try {
    const data = JSON.parse(ctx.webAppData.data);
    
    // Example data structure from Mini App:
    // {
    //   action: 'calculation_complete',
    //   pool: 'BFS/SOL',
    //   capital: 500,
    //   strategy: 'curve',
    //   weeklyROI: 113.5,
    //   dailyFee: 82
    // }
    
    const confirmationMessage = `
✅ *Calculation Saved!*

*Pool:* ${data.pool}
*Capital:* $${data.capital}
*Strategy:* ${data.strategy}
*Weekly ROI:* ${data.weeklyROI > 0 ? '+' : ''}${data.weeklyROI.toFixed(2)}%
*Daily Fee:* $${data.dailyFee.toFixed(2)}

_This is a projection. Actual results may vary._

Want to try another pool? /calculate
    `;
    
    ctx.replyWithMarkdown(confirmationMessage);
  } catch (error) {
    console.error('Error parsing web app data:', error);
    ctx.reply('❌ Error processing data. Please try again.');
  }
});

// ============================================
// INLINE QUERIES (Optional)
// ============================================

// Allow sharing calculator in other chats
bot.on('inline_query', (ctx) => {
  const results = [
    {
      type: 'article',
      id: '1',
      title: '🧮 Meteora DLMM Calculator',
      description: 'Calculate liquidity providing returns',
      input_message_content: {
        message_text: '🧮 *Meteora Calculator*\n\nCalculate DLMM & DAMM returns!\n\nTry it: /calculate',
        parse_mode: 'Markdown'
      },
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.webApp('Open Calculator', MINI_APP_URL)]
      ])
    }
  ];
  
  ctx.answerInlineQuery(results);
});

// ============================================
// ERROR HANDLING
// ============================================

bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply('❌ An error occurred. Please try again or contact support.');
});

// ============================================
// ADDITIONAL HANDLERS
// ============================================

// Handle text messages (catch-all)
bot.on('text', (ctx) => {
  const text = ctx.message.text.toLowerCase();
  
  // Custom responses
  if (text.includes('help') || text.includes('bantuan')) {
    return ctx.reply('Use /help to see all commands');
  }
  
  if (text.includes('pool') || text.includes('list')) {
    return ctx.reply('Use /pools to see available pools');
  }
  
  if (text.includes('calculate') || text.includes('calc')) {
    return ctx.reply('Use /calculate to open calculator');
  }
  
  // Default response
  ctx.reply(
    'Hi! I\'m Meteora Calculator Bot 🧮\n\nUse /start to see all features.',
    Markup.inlineKeyboard([
      [Markup.button.webApp('🧮 Open Calculator', MINI_APP_URL)]
    ])
  );
});

// ============================================
// BOT LIFECYCLE
// ============================================

// Start bot
bot.launch({
  webhook: {
    // For production with webhook
    // domain: 'https://your-bot-domain.com',
    // port: process.env.PORT || 3000
  }
}).then(() => {
  console.log('✅ Meteora Calculator Bot started!');
  console.log(`📱 Mini App URL: ${MINI_APP_URL}`);
  console.log(`🤖 Bot username: @${bot.botInfo.username}`);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// ============================================
// WEBHOOK SETUP (Production)
// ============================================

// If using webhooks instead of polling:
/*
const express = require('express');
const app = express();

app.use(bot.webhookCallback('/webhook'));

bot.telegram.setWebhook(`https://your-domain.com/webhook`);

app.listen(process.env.PORT || 3000, () => {
  console.log('Bot webhook server running');
});
*/

// ============================================
// EXPORTS (for testing)
// ============================================

module.exports = bot;
