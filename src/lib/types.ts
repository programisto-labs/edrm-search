/**
 * Internal provider interface for the search engine (OpenSearch/ES).
 * Public search contract is EnduranceSearchProvider from @programisto/endurance.
 */
export interface InternalSearchResponse {
  hits: Array<{
    _id: string;
    _source: object;
  }>;
}

export interface InternalSearchProvider {
  index(indexName: string, id: string, body: object): Promise<void>;
  remove(indexName: string, id: string): Promise<void>;
  search(indexName: string, body: object): Promise<InternalSearchResponse>;
  ensureIndex(indexName: string): Promise<void>;
}
