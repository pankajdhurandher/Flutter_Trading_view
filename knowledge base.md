# Knowledge Base — Flutter Trading View

This document consolidates key information about the project for discussion, onboarding and engineering decisions. It replaces earlier scattered documentation and is intended to be the single source of truth.

## 1. Project Overview

- **Purpose:** Mobile (Flutter) app that displays trading charts, uses a TradingView chart embed, and connects to a backend to fetch market data and updates in real time.
- **Main repos/areas:**
  - Flutter app: `lib/` (UI, features, screens)
  - Backend: `backend/src/` (API, websockets, services)
  - Static chart embed: `assets/tradingview/chart.html`

## 2. App Workflow (High level)

1. App boots and runs `main.dart` which initializes app services (routing, theme, network).
2. User navigates to `ChartScreen` (`lib/screens/chart_screen.dart`) to view a trading/chart UI.
3. The chart view loads a local HTML TradingView embed (`assets/tradingview/chart.html`) into a WebView component (or platform web view widget).
4. The Flutter app establishes a WebSocket connection with the backend for live updates (tick data, order book snapshots) and also may call REST endpoints for historical or initial data loads.
5. Backend receives market data from external providers, normalizes it, and pushes updates to connected clients via the WebSocket channel.
6. The WebView and/or native Flutter chart UI receive updates and re-render accordingly.

## 3. Modules and Responsibilities

- `lib/screens/` — top-level screens like `chart_screen.dart`, home screen, selectors. UI entry points.
- `lib/features/chart/` — chart-related logic, adapters for data to chart format, indicators, series management.
- `lib/core/network/` and `lib/shared/` — network client wrappers, models, shared widgets and theme.
- `backend/src/` — Node/TypeScript backend (see `package.json`), contains API routes, websocket logic, services that fetch or receive external market data.
- `assets/tradingview/chart.html` — local HTML that initializes and configures a TradingView widget/embed. The Flutter app loads this file into a WebView and communicates with it via JS messages.

## 4. WebSockets — how we use them

- **Purpose:** Real-time push of market updates (quotes, trades, order book deltas), and deliver server-side events to clients.
- **Backend:** WebSocket server code lives under `backend/src/websocket/` or `backend/src/sockets/` (use those folders for connection handling, authentication, broadcasting).
- **Client:** Flutter opens a persistent WebSocket (via `web_socket_channel`, `socket_io_client`, or native implementation) to the backend endpoint (e.g., `wss://.../ws`).
- **Message patterns:**
  - Subscribe: client subscribes to symbols or channels after connection.
  - Snapshot: server sends an initial snapshot (history or full book) on subscribe.
  - Delta/Update: subsequent messages contain incremental updates.
  - Heartbeat/ping: used to detect stale connections.
- **Security:** Authenticate connection with token/query param or an initial auth message. Reconnect logic should implement exponential backoff and resubscription.

## 5. TradingView Embed and Integration

- `assets/tradingview/chart.html` contains the TradingView widget bootstrap. The HTML file is loaded into a WebView inside `ChartScreen`.
- Communication options between Flutter and the TradingView HTML:
  - Post messages from Flutter into the WebView (initial data, subscription confirmations, zoom commands).
  - Listen for messages emitted by the WebView (user interactions, requests for more data).
- Data flow: either the Flutter app forwards backend websocket updates into the WebView (via evaluateJavascript / postMessage), or the WebView itself opens a websocket/HTTP to the backend depending on implementation.

## 6. Data ingestion and external libraries

- External market data can come into the backend using adapters (REST polling, websocket connections to exchanges, or third-party aggregators).
- Backend responsibility:
  - Normalize feed formats from different providers into the app's canonical message format.
  - Persist or cache snapshots where needed (for late-joining clients requesting history).
  - Push normalized updates to subscribers.
- Frontend adapters:
  - Convert backend messages into the chart library's expected series format (timestamps, price, volume, OHLC arrays).
  - Handle timezones and timestamp consistency.

## 7. Key files and locations (quick reference)

- App entry: `lib/main.dart`
- Chart screen: `lib/screens/chart_screen.dart`
- Chart feature: `lib/features/chart/` (chart adapters, models)
- Backend entry: `backend/src/index.ts` / `backend/src/app.ts`
- Backend controllers/services: `backend/src/controllers/`, `backend/src/services/`
- TradingView HTML: `assets/tradingview/chart.html`

## 8. Environment, build and run (developer note)

- Flutter: standard Flutter build flows. Use `flutter run` / `flutter build` for target platforms.
- Backend: Node/TS project in `backend/` — use `npm install` then `npm run dev` or `npm start` depending on scripts in `backend/package.json`.

## 9. Discussion points & Open questions

- Decide where normalization should occur (backend vs. frontend).
- Choose whether the WebView should be the single source of truth for chart state (i.e., WebView holds series) or Flutter holds a canonical state and forwards updates.
- Offline/historic data strategy: caching snapshots in backend or using a dedicated time-series store.

## 10. Maintenance notes

- Keep `assets/tradingview/chart.html` in sync with any TradingView API keys or library updates.
- Document message formats (subscribe/unsubscribe, snapshot, delta) in `backend/` code comments or a small JSON schema inside the `knowledge base` when formats stabilise.

---
If you'd like, I can:
- Expand any section with exact message examples and JSON schemas.
- Open a PR that replaces the removed files with this consolidated file and update `README` references.

