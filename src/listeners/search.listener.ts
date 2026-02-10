import { enduranceListener, EnduranceSearchMiddleware } from '@programisto/endurance';
import { searchService } from '../lib/search-service.js';
import { EdrmSearchProviderAdapter } from '../lib/search-provider-adapter.js';

function getCollectionNameFromDoc(doc: unknown, eventName: string): string {
  const ctor = (doc as { constructor?: { getModel?: () => { collection?: { name?: string } } } })
    ?.constructor;
  const name = ctor?.getModel?.()?.collection?.name;
  if (name) return name;
  const className = eventName.split(':')[0] ?? '';
  const lower = className.toLowerCase();
  return lower.endsWith('s') ? lower : lower + 's';
}

function docToPlainObject(doc: unknown): object {
  if (doc === null || doc === undefined) return {};
  const d = doc as { toJSON?: () => object; toObject?: () => object };
  if (typeof d.toJSON === 'function') return d.toJSON();
  if (typeof d.toObject === 'function') return d.toObject();
  if (typeof doc === 'object' && doc !== null) return { ...(doc as object) };
  return {};
}

if (searchService.isEnabled()) {
  EnduranceSearchMiddleware.setInstance(new EdrmSearchProviderAdapter());
}

enduranceListener.createAnyListener(async (...args: unknown[]) => {
  if (!searchService.isEnabled()) return;
  if (!args?.length || typeof args[0] !== 'string') return;

  const event = args[0] as string;
  const data = args.length > 1 ? args[1] : undefined;

  try {
    if (event.endsWith(':postSave') && data) {
      const doc = data as { _id?: unknown };
      const id = doc._id != null ? String(doc._id) : undefined;
      if (id == null) return;
      const collectionName = getCollectionNameFromDoc(doc, event);
      const payload = docToPlainObject(doc);
      searchService.index(collectionName, id, payload).catch((err) => {
        console.error('[edrm-search] postSave index error:', err);
      });
    } else if (event.endsWith(':postDeleteOne') && data && typeof data === 'object') {
      const payload = data as { id?: unknown; collectionName?: string };
      const id = payload.id != null ? String(payload.id) : undefined;
      const collectionName = payload.collectionName;
      if (id != null && collectionName) {
        searchService.remove(collectionName, id).catch((err) => {
          console.error('[edrm-search] postDeleteOne remove error:', err);
        });
      }
    }
  } catch (err) {
    console.error('[edrm-search] Listener error:', err);
  }
});
