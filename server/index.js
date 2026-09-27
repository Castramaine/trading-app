import express from 'express';
import cors from 'cors';

const app = express();
const port = Number(process.env.PORT || 3001);
const provider = (process.env.MARKET_PROVIDER || 'mock').toLowerCase();
const apiKey = process.env.MARKET_API_KEY || process.env.FINNHUB_API_KEY || '';

app.use(cors());
app.use(express.json());

const mock = {
  NAS100: { symbol: 'NAS100', name: 'Nasdaq 100', price: 19820.12, change: 86.44, changePct: 0.44, high: 19877.32, low: 19790.47, volume: 1542000, spread: 1.2, dayRange: [19740.1, 19910.3], history: [19690, 19710, 19680, 19715, 19750, 19780, 19810, 19795, 19830, 19820] },
  EURUSD: { symbol: 'EURUSD', name: 'Euro / US Dollar', price: 1.0896, change: 0.0012, changePct: 0.11, high: 1.0911, low: 1.0868, volume: 890000, spread: 0.0001, dayRange: [1.0861, 1.0915], history: [1.0842, 1.0847, 1.0851, 1.0858, 1.0864, 1.0873, 1.0884, 1.0889, 1.0892, 1.0896] },
  GBPJPY: { symbol: 'GBPJPY', name: 'Pound / Japanese Yen', price: 198.14, change: 0.62, changePct: 0.31, high: 198.63, low: 196.88, volume: 640000, spread: 0.07, dayRange: [196.6, 199.11], history: [196.3, 196.7, 197.1, 196.9, 197.5, 197.9, 198.2, 198.0, 198.3, 198.14] },
  XAUUSD: { symbol: 'XAUUSD', name: 'Gold / US Dollar', price: 2346.7, change: 12.4, changePct: 0.53, high: 2352.1, low: 2328.5, volume: 420000, spread: 0.4, dayRange: [2329.5, 2355.7], history: [2320.1, 2324.8, 2328.2, 2331.4, 2338.2, 2340.5, 2341.8, 2343.9, 2345.1, 2346.7] }
};

function tickMock() {
  Object.values(mock).forEach((market) => {
    const delta = (Math.random() - 0.5) * (market.symbol === 'NAS100' ? 18 : market.symbol === 'GBPJPY' ? 0.8 : 0.004);
    market.price = Number((market.price + delta).toFixed(4));
    market.change = Number((market.price - market.history[0]).toFixed(4));
    market.changePct = Number(((market.change / market.history[0]) * 100).toFixed(2));
    market.high = Math.max(market.high, market.price);
    market.low = Math.min(market.low, market.price);
    market.history.push(market.price);
    if (market.history.length > 20) market.history.shift();
  });
}

function snapshot() {
  return Object.values(mock).map((market) => ({
    ...market,
    price: Number(market.price.toFixed(market.symbol === 'NAS100' ? 2 : 4)),
    change: Number(market.change.toFixed(market.symbol === 'NAS100' ? 2 : 4))
  }));
}

async function getFinnhubMarkets() {
  if (!apiKey) return null;
  try {
    const quote = await fetch(`https://finnhub.io/api/v1/quote?symbol=^NDX&token=${encodeURIComponent(apiKey)}`);
    if (!quote.ok) throw new Error(`Finnhub returned ${quote.status}`);
    const ndx = await quote.json();
    if (!Number(ndx.c)) throw new Error('Finnhub returned no NAS100 quote');
    const current = Number(ndx.c);
    return snapshot().map((market) => market.symbol === 'NAS100'
      ? { ...market, price: current, change: Number(ndx.d || 0), changePct: Number(ndx.dp || 0), high: Number(ndx.h || current), low: Number(ndx.l || current), history: [...market.history.slice(-19), current] }
      : market);
  } catch (error) {
    console.warn('Live provider unavailable; using mock fallback:', error.message);
    return null;
  }
}

async function markets() {
  if (provider === 'finnhub') return (await getFinnhubMarkets()) || snapshot();
  return snapshot();
}

app.get('/api/markets', async (_req, res) => {
  res.json({ mode: provider === 'finnhub' && apiKey ? 'live' : 'mock', provider, timestamp: new Date().toISOString(), markets: await markets() });
});

app.get('/api/stream', async (_req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  const send = async () => res.write(`data: ${JSON.stringify({ mode: provider === 'finnhub' && apiKey ? 'live' : 'mock', provider, timestamp: new Date().toISOString(), markets: await markets() })}\n\n`);
  if (provider === 'mock' || !apiKey) tickMock();
  await send();
  const interval = setInterval(async () => { if (provider === 'mock' || !apiKey) tickMock(); await send(); }, 1500);
  res.on('close', () => clearInterval(interval));
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok', mode: provider === 'finnhub' && apiKey ? 'live' : 'mock', provider, hasApiKey: Boolean(apiKey) }));

app.listen(port, () => console.log(`Trading backend listening at http://localhost:${port} (${provider === 'finnhub' && apiKey ? 'live' : 'mock'} mode)`));
