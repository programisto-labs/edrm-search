import {
  EnduranceRouter,
  EnduranceSearchMiddleware,
  type SecurityOptions
} from '@programisto/endurance';
import type { Request, Response } from 'express';

const ROUTES_DISABLED_MESSAGE = 'Search routes are disabled. Use the search middleware from your module.';
const ROUTES_DISABLED_CODE = 'SEARCH_ROUTES_DISABLED';

function routesEnabled(): boolean {
  return process.env.EDRM_SEARCH_ROUTES_ENABLED === 'true';
}

class SearchRouter extends EnduranceRouter {
  protected setupRoutes(): void {
    this.router.use((req: Request, res: Response, next: () => void) => {
      if (!routesEnabled()) {
        res.status(503).json({ message: ROUTES_DISABLED_MESSAGE, code: ROUTES_DISABLED_CODE });
        return;
      }
      next();
    });

    const securityOptions: SecurityOptions = { requireAuth: true, permissions: [] };

    this.post('/', securityOptions, this.searchPost.bind(this));
    this.get('/', securityOptions, this.searchGet.bind(this));
  }

  private async searchPost(req: Request, res: Response): Promise<void> {
    try {
      const collection = req.body?.collection ?? req.query?.collection;
      if (!collection || typeof collection !== 'string') {
        res.status(400).json({ error: 'Missing or invalid "collection" (string)' });
        return;
      }
      const provider = EnduranceSearchMiddleware.getInstance();
      if (!provider.isSearchEnabled()) {
        res.status(503).json({ error: 'Search is not enabled', code: 'SEARCH_NOT_ENABLED' });
        return;
      }
      const options = {
        collection,
        q: req.body?.q ?? req.query?.q,
        filter: req.body?.filter ?? req.query?.filter,
        sort: req.body?.sort ?? req.query?.sort,
        from: req.body?.from ?? req.query?.from,
        size: req.body?.size ?? req.query?.size,
        body: req.body?.body
      };
      const result = await provider.search(collection, options);
      res.json(result);
    } catch (err) {
      console.error('[edrm-search] Search error:', err);
      res.status(500).json({ error: 'Search failed' });
    }
  }

  private async searchGet(req: Request, res: Response): Promise<void> {
    try {
      const collection = req.query?.collection;
      if (!collection || typeof collection !== 'string') {
        res.status(400).json({ error: 'Missing or invalid "collection" query (string)' });
        return;
      }
      const provider = EnduranceSearchMiddleware.getInstance();
      if (!provider.isSearchEnabled()) {
        res.status(503).json({ error: 'Search is not enabled', code: 'SEARCH_NOT_ENABLED' });
        return;
      }
      const options = {
        collection,
        q: req.query?.q as string | undefined,
        filter: req.query?.filter as object | undefined,
        sort: req.query?.sort as Array<{ [field: string]: 'asc' | 'desc' }> | undefined,
        from: req.query?.from != null ? Number(req.query.from) : undefined,
        size: req.query?.size != null ? Number(req.query.size) : undefined
      };
      const result = await provider.search(collection, options);
      res.json(result);
    } catch (err) {
      console.error('[edrm-search] Search error:', err);
      res.status(500).json({ error: 'Search failed' });
    }
  }
}

export default new SearchRouter();
