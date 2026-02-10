import {
  EnduranceSearchProvider,
  type SearchOptions,
  type SearchResult
} from '@programisto/endurance';
import { searchService } from './search-service.js';

export class EdrmSearchProviderAdapter extends EnduranceSearchProvider {
  isSearchEnabled(): boolean {
    return searchService.isEnabled();
  }

  async search(collection: string, options: SearchOptions): Promise<SearchResult> {
    return searchService.search(collection, { ...options, collection });
  }
}
