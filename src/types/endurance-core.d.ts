declare module '@programisto/endurance' {
  export interface EnduranceRequest {
    body: unknown;
    query: Record<string, string | undefined>;
    [key: string]: unknown;
  }

  export interface SecurityOptions {
    requireAuth?: boolean;
    permissions?: string[];
  }

  export class EnduranceRouter {
    router: import('express').Router;
    constructor(auth?: unknown, upload?: unknown);
    get(path: string, options: SecurityOptions, ...handlers: unknown[]): void;
    post(path: string, options: SecurityOptions, ...handlers: unknown[]): void;
  }

  export class EnduranceAuthMiddleware {
    static getInstance(): EnduranceAuthMiddleware;
  }

  export interface SearchOptions {
    collection: string;
    q?: string;
    filter?: object;
    sort?: Array<{ [field: string]: 'asc' | 'desc' }>;
    from?: number;
    size?: number;
    body?: object;
  }

  export interface SearchResult {
    hits: Array<{ _id: string; _source: object }>;
  }

  export abstract class EnduranceSearchProvider {
    abstract isSearchEnabled(): boolean;
    abstract search(collection: string, options: SearchOptions): Promise<SearchResult>;
  }

  export const EnduranceSearchMiddleware: {
    getInstance(): EnduranceSearchProvider;
    setInstance(provider: EnduranceSearchProvider): void;
  };

  export const enduranceListener: {
    createAnyListener: (fn: (...args: unknown[]) => void | Promise<void>) => void;
  };
}
