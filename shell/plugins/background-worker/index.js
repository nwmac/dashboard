import { markRaw } from 'vue'
import workerConstructor from './web-worker.background.ts';

/**
 * Create and link the background worker creator to the store
 */
export default function({ store }) {
  store.backgroundCreateWorker = markRaw(() => new workerConstructor());
}
