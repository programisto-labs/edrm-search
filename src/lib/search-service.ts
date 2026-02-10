import type { SearchOptions, SearchResult } from '@programisto/endurance';
import type { InternalSearchProvider, InternalSearchResponse } from './types.js';
import { createOpenSearchProvider } from './opensearch-provider.js';

const DEFAULT_SIZE = 20;
const MAX_SIZE = 100;

function buildSearchBody(options: SearchOptions): object {
  if (options.body && typeof options.body === 'object') {
    return options.body;
  }

  const body: Record<string, unknown> = {
    from: options.from ?? 0,
    size: Math.min(options.size ?? DEFAULT_SIZE, MAX_SIZE)
  };

  const must: object[] = [];
  if (options.q && String(options.q).trim()) {
    must.push({
      query_string: {
        query: String(options.q).trim(),
        default_field: '*'
      }
    });
  }
  if (options.filter && typeof options.filter === 'object' && Object.keys(options.filter).length > 0) {
    const filterClauses = Object.entries(options.filter).map(([field, value]) => ({
      term: { [field]: value }
    }));
    must.push({ bool: { filter: filterClauses } });
  }

  if (must.length > 0) {
    body.query = { bool: { must } };
  } else if (!body.query) {
    body.query = { match_all: {} };
  }

  if (options.sort && options.sort.length > 0) {
    body.sort = options.sort;
  }

  return body;
}

class SearchService {
  private provider: InternalSearchProvider | null = null;
  private prefix = process.env.SEARCH_ENGINE_INDEX_PREFIX ?? '';

  private getProvider(): InternalSearchProvider {
    if (!this.provider) {
      this.provider = createOpenSearchProvider();
    }
    return this.provider;
  }

  isEnabled(): boolean {
    const url = process.env.SEARCH_ENGINE_URL;
    const enabled = process.env.SEARCH_ENGINE_ENABLED;
    return Boolean(url && (enabled === 'true' || enabled === '1'));
  }

  getIndexName(collectionName: string): string {
    return this.prefix + collectionName;
  }

  async index(collectionName: string, id: string, document: object): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      const indexName = this.getIndexName(collectionName);
      const provider = this.getProvider();
      await provider.ensureIndex(indexName);
      await provider.index(indexName, String(id), document);
    } catch (err) {
      console.error('[edrm-search] Index error:', err);
    }
  }

  async remove(collectionName: string, id: string): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      const indexName = this.getIndexName(collectionName);
      const provider = this.getProvider();
      await provider.remove(indexName, String(id));
    } catch (err: unknown) {
      const status = (err as { meta?: { statusCode?: number } })?.meta?.statusCode;
      if (status !== 404) {
        console.error('[edrm-search] Remove error:', err);
      }
    }
  }

  async search(collectionName: string, options: SearchOptions): Promise<SearchResult> {
    if (!this.isEnabled()) {
      return { hits: [] };
    }
    try {
      const indexName = this.getIndexName(collectionName);
      const body = buildSearchBody({ ...options, collection: collectionName });
      const provider = this.getProvider();
      const result: InternalSearchResponse = await provider.search(indexName, body);
      return { hits: result.hits };
    } catch (err) {
      console.error('[edrm-search] Search error:', err);
      return { hits: [] };
    }
  }
}

export const searchService = new SearchService();
