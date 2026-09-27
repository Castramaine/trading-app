# Trading App

A trading dashboard for NAS100 and forex markets with a simulated live-feed stream.

## Features
- Live market snapshot and streaming updates for NAS100 and major forex pairs
- Watchlist with price, change, and day range
- Position and P&L summary
- Order ticket panel
- Simple interactive chart
- Ready for real market data provider integration

## Stack
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express
- Live feed: SSE (Server-Sent Events) simulation

## Getting started

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

## Notes
This project uses simulated market data to give you a working trading app immediately. To hook up real market feeds or broker APIs, replace the streaming generator with a provider like Polygon, Twelve Data, or your broker websocket API.
