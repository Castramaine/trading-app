import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const marketData = {
  NAS100: {
    symbol: 'NAS100',
    name: 'Nasdaq 100',
    price: 19820.12,
    change: 86.44,
    changePct: 0.44,
    high: 19877.32,
    low: 19790.47,
    volume: 1542000,
    spread: 1.2,
    dayRange: [19740.1, 19910.3],
    history: [19690, 19710, 19680, 19715, 19750, 19780, 19810, 19795, 19830, 19820]
  },
  EURUSD: {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    price: 1.0896,
    change: 0.0012,
    changePct: 0.11,
    high: 1.0911,
    low: 1.0868,
    volume: 890000,
    spread: 0.0001,
    dayRange: [1.0861, 1.0915],
    history: [1.0842, 1.0847, 1.0851, 1.0858, 1.0864, 1.0873, 1.0884, 1.0889, 1.0892, 1.0896]
  },
  GBPJPY: {
    symbol: 'GBPJPY',
    name: 'Pound / Japanese Yen',
    price: 198.14,
    change: 0.62,
    changePct: 0.31,
    high: 198.63,
    low: 196.88,
    volume: 640000,
    spread: 0.07,
    dayRange: [196.6, 199.11],
    history: [196.3, 196.7, 197.1, 196.9, 197.5, 197.9, 198.2, 198.0, 198.3, 198.14]
  },
  XAUUSD: {
    symbol: 'XAUUSD',
    name: 'Gold / US Dollar',
    price: 2346.7,
    change: 12.4,
    changePct: 0.53,
    high: 2352.1,
    low: 2328.5,
    volume: 420000,
    spread: 0.4,
    dayRange: [2329.5, 2355.7],
    history: [2320.1, 2324.8, 2328.2, 2331.4, 2338.2, 2340.5, 2341.8, 2343.9, 2345.1, 2346.7]
  }
};

const baseSymbols = Object.keys(marketData);

function randomStep(value, maxDelta) {
  const delta = (Math.random() - 0.5) * maxDelta;
  return Number((value + delta).toFixed(4));
}

function tickMarketData() {
  Object.values(marketData).forEach((market) => {
    const maxDelta = market.symbol.includes('JPY') ? 0.8 : market.symbol.includes('USD') ? 0.004 : 18;
    const nextPrice = randomStep(market.price, maxDelta);

    market.price = nextPrice;
    market.change = Number((nextPrice - market.history[0]).toFixed(4));
    market.changePct = Number(((market.change / market.history[0]) * 100).toFixed(2));
    market.high = Math.max(market.high, nextPrice);
    market.low = Math.min(market.low, nextPrice);
    market.history.push(nextPrice);
    if (market.history.length > 20) market.history.shift();
  });
}

function getMarkets() {
  return Object.values(marketData).map((market) => ({
    ...market,
    dayRange: market.dayRange,
    price: Number(market.price.toFixed(market.symbol.includes('USD') || market.symbol.includes('JPY') ? 4 : 2)),
    change: Number(market.change.toFixed(market.symbol.includes('USD') || market.symbol.includes('JPY') ? 4 : 2)),
    changePct: Number(market.changePct.toFixed(2))
  }));
}

app.get('/api/markets', (_req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    markets: getMarkets()
  });
});

app.get('/api/stream', (_req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = () => {
    tickMarketData();
    const payload = JSON.stringify({
      timestamp: new Date().toISOString(),
      markets: getMarkets()
    });

    res.write(`data: ${payload}\n\n`);
  };

  send();
  const interval = setInterval(send, 1500);

  res.on('close', () => {
    clearInterval(interval);
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Trading app backend running at http://localhost:${port}`);
});
