# revealer-api

Node Server for REVEALER proxy server.

## Swagger API Docs

- [swagger docs](https://revealer.bridge.sbtc.tech/revealer-api/).

## Build

```bash
node -v
npm install
npm run build
```

### Mongo

Connects to Mongo Cloud development db instance using environment variables see Environment secton.

Local IP address has to be added to Mongo Cloud allowed network - contact system administrator.

### Environment

Environment is set on target server ad injected via docker variables. Config for running
locally without docker is set i `$lib/config.ts`

## Test

Tests outstanding,

```bash
npm run test
```

## Deploy

Currently builds to Linode via ssh and rsync.
