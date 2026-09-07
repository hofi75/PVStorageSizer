# PVStorageSizer

A web app that simulates quarter-hourly electricity consumption and solar
production CSV data to find the optimal battery storage capacity (kWh) for a
given site: it minimizes energy exported to the grid while keeping battery
utilization reasonable, and covers as much night consumption as possible from
daytime production.

The UI is available in English (default), Hungarian, and German - switch with
the language selector in the top-right corner.

## Prerequisites

- Node.js 20+ and npm

## Install

```bash
npm install
```

This installs dependencies for both the `server` and `client` workspaces (via
the root `package.json`'s npm workspaces).

## Run in development

```bash
npm run dev
```

This starts:
- the backend API: http://localhost:3001
- the frontend: http://localhost:5173 (open this in your browser)

## Usage

1. Upload the consumption CSV and the production CSV (for the same site).
2. In the preview, the app auto-detects which column is the timestamp (or
   separate date+time columns), which is the value, in what format, and
   whether there's a header row - adjust if needed. There's no fixed CSV
   format assumption: any delimiter (`,`/`;`/tab), Hungarian or English date
   format, and kWh/kW/W values are supported.
3. Optionally adjust the simulation parameters: round-trip efficiency, max
   charge/discharge power, minimum state of charge, and the capacity range to
   test.
4. Click "Run simulation". The result includes the recommended capacity, the
   reasoning behind it, and detailed charts (capacity sweep curves, average
   daily profile, grid exchange, daily schedule).

## Docker

```bash
docker build -t pvstoragesizer .
docker run --rm -p 3001:3001 pvstoragesizer
```

Builds both workspaces and serves the whole app (API + static client) from a
single container. See the `Dockerfile` for build-time registry auth notes.

## Build

```bash
npm run build
npm run typecheck
```
