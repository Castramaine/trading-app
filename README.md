# Trading App

A trading dashboard for NAS100 and forex markets with a live-market-ready backend and simulated fallback feed.

## Features
- Live market dashboard for NAS100 and major forex pairs
- Watchlist with price, change, and day range
- Position and P&L summary
- Order ticket panel
- Interactive chart
- Real-provider-ready API layer with mock fallback

## Stack
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express
- Live feed mode: configurable provider with automatic fallback to mock data

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the app:
   ```bash
   npm run dev
   ```
3. Open the frontend in your browser at:
   ```text
   http://localhost:5173
   ```

The backend API runs at:
- http://localhost:3001/api/markets
- http://localhost:3001/api/stream

## Real market data integration

This version is ready to plug into a real market provider. Configure the backend with environment variables before starting the app:

```bash
cp .env.example .env
```

Then set:
```env
MARKET_PROVIDER=finnhub
MARKET_API_KEY=your_api_key_here
```

Supported modes:
- `mock` — default, no key required
- `finnhub` — uses Finnhub if a valid API key is provided

If the provider is not configured or the request fails, the app automatically falls back to the simulated live feed so the dashboard still works.

## Notes
This app is structured for extension into production trading workflows: live data, authentication, order management, positions, risk limits, and broker integration.
