import { useEffect, useMemo, useState } from 'react';

type Market = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  volume: number;
  spread: number;
  history: number[];
  dayRange: [number, number];
};

type OrderType = 'Buy' | 'Sell';

const defaultOrder = {
  symbol: 'NAS100',
  side: 'Buy' as OrderType,
  quantity: 1,
  price: 19820.12
};

function formatPrice(value: number, symbol: string) {
  if (symbol === 'NAS100') return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (symbol === 'GBPJPY' || symbol === 'XAUUSD') return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return value.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

function formatPct(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function App() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [order, setOrder] = useState(defaultOrder);
  const [selectedSymbol, setSelectedSymbol] = useState('NAS100');

  useEffect(() => {
    fetch('/api/markets')
      .then((response) => response.json())
      .then((data) => {
        setMarkets(data.markets);
        setOrder((prev) => ({ ...prev, price: data.markets.find((m: Market) => m.symbol === prev.symbol)?.price ?? prev.price }));
      })
      .catch((error) => console.error('Failed to load markets', error));

    const stream = new EventSource('/api/stream');
    stream.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMarkets(data.markets);
      setOrder((prev) => ({ ...prev, price: data.markets.find((m: Market) => m.symbol === prev.symbol)?.price ?? prev.price }));
    };
    stream.onerror = () => {
      console.warn('Stream disconnected. Reconnect will retry automatically.');
    };

    return () => stream.close();
  }, []);

  const selectedMarket = useMemo(
    () => markets.find((market) => market.symbol === selectedSymbol) ?? markets[0],
    [markets, selectedSymbol]
  );

  const totalPnL = useMemo(() => {
    const positions = [
      { symbol: 'NAS100', pnl: 420.7 },
      { symbol: 'EURUSD', pnl: 84.8 },
      { symbol: 'GBPJPY', pnl: -12.3 }
    ];

    return positions.reduce((sum, item) => sum + item.pnl, 0);
  }, []);

  const chartPoints = useMemo(() => {
    if (!selectedMarket || selectedMarket.history.length === 0) return '';
    const width = 620;
    const height = 180;
    const min = Math.min(...selectedMarket.history);
    const max = Math.max(...selectedMarket.history);
    const range = max - min || 1;

    return selectedMarket.history
      .map((value, index) => {
        const x = (index / (selectedMarket.history.length - 1)) * width;
        const y = height - ((value - min) / range) * (height - 24) - 12;
        return `${x},${y}`;
      })
      .join(' ');
  }, [selectedMarket]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">P</div>
          <div>
            <h1>Pulse</h1>
            <span>Trading Desk</span>
          </div>
        </div>

        <nav className="nav">
          <button className="nav-item active">Dashboard</button>
          <button className="nav-item">Markets</button>
          <button className="nav-item">Portfolios</button>
          <button className="nav-item">Alerts</button>
        </nav>

        <div className="mini-card">
          <span>Portfolio Value</span>
          <strong>$418,980.22</strong>
          <small className="positive">+2.64% today</small>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Market Overview</p>
            <h2>NASDAQ & FX Live Feed</h2>
          </div>
          <div className="topbar-actions">
            <button className="ghost-button">Export</button>
            <button className="primary-button">New Trade</button>
          </div>
        </header>

        <section className="market-grid">
          {markets.map((market) => (
            <button
              key={market.symbol}
              className={`market-card ${selectedSymbol === market.symbol ? 'selected' : ''}`}
              onClick={() => {
                setSelectedSymbol(market.symbol);
                setOrder((prev) => ({ ...prev, symbol: market.symbol, price: market.price }));
              }}
            >
              <div className="market-row">
                <div>
                  <span className="pair">{market.symbol}</span>
                  <p>{market.name}</p>
                </div>
                <span className={`badge ${market.changePct >= 0 ? 'positive' : 'negative'}`}>
                  {formatPct(market.changePct)}
                </span>
              </div>
              <strong>{formatPrice(market.price, market.symbol)}</strong>
              <small>
                {market.change >= 0 ? '+' : ''}
                {formatPrice(market.change, market.symbol)}
              </small>
            </button>
          ))}
        </section>

        <section className="content-grid">
          <div className="panel chart-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Instrument</p>
                <h3>{selectedMarket?.symbol}</h3>
              </div>
              <div className="price-block">
                <strong>{selectedMarket ? formatPrice(selectedMarket.price, selectedMarket.symbol) : '--'}</strong>
                <span className={selectedMarket && selectedMarket.changePct >= 0 ? 'positive' : 'negative'}>
                  {selectedMarket ? formatPct(selectedMarket.changePct) : '--'}
                </span>
              </div>
            </div>

            <svg viewBox="0 0 620 180" className="chart" role="img" aria-label="Price chart">
              <defs>
                <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5ce1e6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#5ce1e6" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <g>
                <polyline fill="none" stroke="#5ce1e6" strokeWidth="3" points={chartPoints} />
                <polygon fill="url(#lineFill)" points={`0,180 ${chartPoints} 620,180`} />
              </g>
            </svg>

            <div className="stats-row">
              <div>
                <span>High</span>
                <strong>{selectedMarket ? formatPrice(selectedMarket.high, selectedMarket.symbol) : '--'}</strong>
              </div>
              <div>
                <span>Low</span>
                <strong>{selectedMarket ? formatPrice(selectedMarket.low, selectedMarket.symbol) : '--'}</strong>
              </div>
              <div>
                <span>Spread</span>
                <strong>{selectedMarket ? selectedMarket.spread : '--'}</strong>
              </div>
              <div>
                <span>Volume</span>
                <strong>{selectedMarket ? selectedMarket.volume.toLocaleString() : '--'}</strong>
              </div>
            </div>
          </div>

          <div className="panel order-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Trade</p>
                <h3>Order Ticket</h3>
              </div>
            </div>

            <div className="ticket-grid">
              <label>
                Symbol
                <select
                  value={order.symbol}
                  onChange={(event) => {
                    const symbol = event.target.value;
                    const match = markets.find((market) => market.symbol === symbol);
                    setOrder((prev) => ({ ...prev, symbol, price: match?.price ?? prev.price }));
                    setSelectedSymbol(symbol);
                  }}
                >
                  {markets.map((market) => (
                    <option key={market.symbol} value={market.symbol}>{market.symbol}</option>
                  ))}
                </select>
              </label>

              <label>
                Side
                <select
                  value={order.side}
                  onChange={(event) => setOrder((prev) => ({ ...prev, side: event.target.value as OrderType }))}
                >
                  <option value="Buy">Buy</option>
                  <option value="Sell">Sell</option>
                </select>
              </label>

              <label>
                Quantity
                <input
                  type="number"
                  min={1}
                  value={order.quantity}
                  onChange={(event) => setOrder((prev) => ({ ...prev, quantity: Number(event.target.value) || 1 }))}
                />
              </label>

              <label>
                Limit Price
                <input
                  type="number"
                  step="0.01"
                  value={order.price}
                  onChange={(event) => setOrder((prev) => ({ ...prev, price: Number(event.target.value) || 0 }))}
                />
              </label>
            </div>

            <div className="order-actions">
              <button className="primary-button">{order.side} {order.symbol}</button>
              <button className="ghost-button">Cancel</button>
            </div>
          </div>
        </section>

        <section className="bottom-grid">
          <div className="panel">
            <div className="panel-header small-gap">
              <div>
                <p className="eyebrow">Open Positions</p>
                <h3>Portfolio</h3>
              </div>
            </div>

            <div className="position-list">
              <div className="position-row">
                <span>NAS100</span>
                <strong>2.1 lots</strong>
                <em className="positive">+$420.70</em>
              </div>
              <div className="position-row">
                <span>EURUSD</span>
                <strong>1.8 lots</strong>
                <em className="positive">+$84.80</em>
              </div>
              <div className="position-row">
                <span>GBPJPY</span>
                <strong>0.5 lots</strong>
                <em className="negative">-$12.30</em>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header small-gap">
              <div>
                <p className="eyebrow">Performance</p>
                <h3>P&L Summary</h3>
              </div>
            </div>

            <div className="pnl-box">
              <strong className={totalPnL >= 0 ? 'positive' : 'negative'}>
                {totalPnL >= 0 ? '+' : '-'}${Math.abs(totalPnL).toFixed(2)}
              </strong>
              <span>Realized + unrealized</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
