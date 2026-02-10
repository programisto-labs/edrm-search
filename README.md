# EDRM Search

## Description

EDRM Search is an Endurance module that provides full-text search via OpenSearch (or Elasticsearch). It listens to Endurance schema events (`postSave`, `postDeleteOne`) to keep search indexes in sync with MongoDB collections. Search is exposed through the **Endurance search middleware**, so other EDRM modules can call search without depending on edrm-search.

## Features

- Automatic index sync: documents are indexed on save and removed on delete.
- One index per MongoDB collection (with optional prefix).
- Search via **middleware**: use `EnduranceSearchMiddleware.getInstance().search(collection, options)` in any module.
- Optional unified route `POST /search` (disabled by default; enable with `EDRM_SEARCH_ROUTES_ENABLED=true`).

## Installation

```bash
npm install @programisto/edrm-search
```

## Requirements

- **@programisto/endurance** ≥ 1.0.x (with `EnduranceSearchMiddleware` and `postSave` / `postDeleteOne` events)
- Node.js ≥ 18
- OpenSearch (or compatible) cluster

## Environment Variables

| Variable | Required | Default | Description |
| -------- | -------- | ------- | ----------- |
| `SEARCH_ENGINE_URL` | Yes (if search enabled) | - | OpenSearch/Elasticsearch cluster URL (e.g. `https://localhost:9200`) |
| `SEARCH_ENGINE_ENABLED` | No | - | Set to `true` to enable indexing and the search provider |
| `SEARCH_ENGINE_INDEX_PREFIX` | No | `''` | Prefix for index names (e.g. `app_` → `app_users`) |
| `SEARCH_ENGINE_PROVIDER` | No | `opensearch` | `opensearch` or `elasticsearch` |
| `SEARCH_ENGINE_USERNAME` | No | - | Basic auth username |
| `SEARCH_ENGINE_PASSWORD` | No | - | Basic auth password |
| `EDRM_SEARCH_ROUTES_ENABLED` | No | `false` | Set to `true` to enable the `/search` HTTP routes (disabled by default for security) |

## Using search from another module (middleware)

In any EDRM module, use the Endurance search middleware so you do not depend on edrm-search:

```ts
import { EnduranceSearchMiddleware } from '@programisto/endurance';

// In a route handler:
const provider = EnduranceSearchMiddleware.getInstance();
if (provider.isSearchEnabled()) {
  const result = await provider.search('users', { q: req.query.q, size: 20 });
  res.json(result);
} else {
  // Fallback to Model.find() or other logic
}
```

## Routes (when enabled)

When `EDRM_SEARCH_ROUTES_ENABLED=true`:

- **POST /search** – Body: `{ collection, q?, filter?, sort?, from?, size?, body? }`
- **GET /search** – Query: `collection` (required), `q`, `filter`, `sort`, `from`, `size`

By default these routes return **503** with `code: "SEARCH_ROUTES_DISABLED"` so that search is used only via the middleware from your modules.

## Collection name convention

If the document does not expose a collection name via `constructor.getModel().collection.name`, the listener derives it from the event name (e.g. `User:postSave` → collection `users`).
