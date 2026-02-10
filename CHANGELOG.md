# Changelog

## [1.0.0] (unreleased)

### Added

- Initial release: EDRM Search module for Endurance.
- Listener for `postSave` and `postDeleteOne` events to sync indexes with MongoDB collections.
- OpenSearch provider (index, remove, search, ensureIndex).
- Search service with configurable prefix and lazy index creation.
- Adapter implementing `EnduranceSearchProvider` and registration via `EnduranceSearchMiddleware.setInstance()`.
- Optional routes POST/GET `/search` (disabled by default via `EDRM_SEARCH_ROUTES_ENABLED`).
- Support for `q`, `filter`, `sort`, `from`, `size`, and raw `body` in search options.
