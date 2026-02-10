import { Client } from '@opensearch-project/opensearch';
import type { InternalSearchProvider, InternalSearchResponse } from './types.js';

let clientInstance: Client | null = null;

function getClient(): Client {
  if (!clientInstance) {
    const node = process.env.SEARCH_ENGINE_URL ?? '';
    const clientConfig: { node: string; auth?: { username: string; password: string } } = { node };
    const username = process.env.SEARCH_ENGINE_USERNAME;
    const password = process.env.SEARCH_ENGINE_PASSWORD;
    if (username && password) {
      clientConfig.auth = { username, password };
    }
    clientInstance = new Client(clientConfig);
  }
  return clientInstance;
}

export function createOpenSearchProvider(): InternalSearchProvider {
  const client = getClient();

  return {
    async index(indexName: string, id: string, body: object): Promise<void> {
      await client.index({
        index: indexName,
        id: String(id),
        body: body as Record<string, unknown>,
        refresh: false
      });
    },

    async remove(indexName: string, id: string): Promise<void> {
      await client.delete({
        index: indexName,
        id: String(id),
        refresh: false
      });
    },

    async search(indexName: string, body: object): Promise<InternalSearchResponse> {
      const response = await client.search({
        index: indexName,
        body: body as Record<string, unknown>
      });
      const hits = (response.body.hits?.hits ?? []).map((h: { _id: string; _source?: object }) => ({
        _id: h._id,
        _source: h._source ?? {}
      }));
      return { hits };
    },

    async ensureIndex(indexName: string): Promise<void> {
      try {
        const exists = await client.indices.exists({ index: indexName });
        const existsBody = (exists as { body?: boolean }).body;
        if (!existsBody) {
          await client.indices.create({
            index: indexName,
            body: { settings: { 'index.mapping.total_fields.limit': 2000 } }
          });
        }
      } catch (err: unknown) {
        const status = (err as { meta?: { statusCode?: number } })?.meta?.statusCode;
        if (status === 404) {
          await client.indices.create({
            index: indexName,
            body: { settings: { 'index.mapping.total_fields.limit': 2000 } }
          });
        } else {
          throw err;
        }
      }
    }
  };
}
