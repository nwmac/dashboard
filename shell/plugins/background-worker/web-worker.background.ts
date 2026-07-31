/**
 * This implements a web worker that will perform background tasks to track resources etc
 *
 * This can be used by notifications etc to check the status of async/long-running operations
 *
 * This web worker can perform a specific set of tasks, and can be extended in the future.
 *
 * It is non-trivial to allow extensions to add to this worker, so for now it is fixed. This also provides a more secure environment.
 *
 * This worker can be used via the background-worker API
 */

import { BackgroundWorkerApi, WatchCondition, WatchResourceRequest } from '@shell/apis/intf/shell-api/bg-worker';

export type SendEventData = {
  fn: string;
  args: any[];
  uuid: string;
};

// -------------------------------------------------------------------------------------------------------------------------------------------------------------
// Condition evaluation helpers
// -------------------------------------------------------------------------------------------------------------------------------------------------------------

function getAtPath(obj: any, path: string): any {
  return path.split('.').reduce((acc: any, key: string) => acc?.[key], obj);
}

function evaluateCondition(resource: any, condition: WatchCondition): boolean {
  const value = getAtPath(resource, condition.path);

  if (condition.matchItem !== undefined) {
    if (!Array.isArray(value)) {
      return false;
    }

    const matched = value.find((item: any) =>
      Object.entries(condition.matchItem!).every(([k, v]) => item[k] === v)
    );

    if (!matched) {
      return false;
    }

    if (condition.field !== undefined) {
      return matched[condition.field] === condition.equals;
    }

    return true;
  }

  return value === condition.equals;
}

// -------------------------------------------------------------------------------------------------------------------------------------------------------------
// Worker implementation
// -------------------------------------------------------------------------------------------------------------------------------------------------------------

/**
 * The web worker implements the same interface as in the main UI thread
 */
class BackgroundWebWorker implements BackgroundWorkerApi {
  public async doSomething(msg: string) {
    console.error(`Doing something: ${msg} !!! in the worker`);

    return '12345';
  }

  public async wait(s: number) {
    await new Promise(resolve => setTimeout(resolve, s * 1000));

    // throw new Error('Test error');
    return `waited ${ s }s`;
  }

  /**
   * Poll a resource URL until a condition is met, a timeout elapses, or an error condition fires.
   *
   * The worker issues a same-origin fetch on every poll tick and evaluates the JSON response
   * against the supplied conditions. Browser session cookies are included automatically, so
   * Rancher's cookie-based auth works without any extra configuration.
   */
  public async watchResource({ resourceUrl, options }: WatchResourceRequest): Promise<void> {
    const {
      successCondition,
      errorCondition,
      pollInterval = 5_000,
      timeout = 30 * 60 * 1_000,
    } = options;

    const deadline = Date.now() + timeout;

    while (true) {
      if (Date.now() >= deadline) {
        throw new Error(`Watch timed out after ${ timeout }ms monitoring ${ resourceUrl }`);
      }

      try {
        const response = await fetch(resourceUrl, { headers: { Accept: 'application/json' } });

        if (response.ok) {
          const resource = await response.json();

          if (errorCondition && evaluateCondition(resource, errorCondition)) {
            throw new Error(`Error condition met for ${ resourceUrl }`);
          }

          if (evaluateCondition(resource, successCondition)) {
            return;
          }
        }
        // Non-2xx (e.g. 404 while cluster is still being created) — keep polling.
      } catch (e) {
        // Re-throw our own sentinel errors so the watch stops.
        if (e instanceof Error && (
          e.message.startsWith('Watch timed out') ||
          e.message.startsWith('Error condition met')
        )) {
          throw e;
        }

        // Transient network or parse error — log and continue.
        console.warn(`Background worker: transient error polling ${ resourceUrl }:`, e); // eslint-disable-line no-console
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
}

// -------------------------------------------------------------------------------------------------------------------------------------------------------------
// Create the web worker instance and set up the message handler
// -------------------------------------------------------------------------------------------------------------------------------------------------------------

const worker = new BackgroundWebWorker();

// The worker's API is via message passing to/from the main thread
self.onmessage = (e: MessageEvent<SendEventData>) => {
  const { fn, args, uuid } = e.data;
  const obj = worker as any;

  if (typeof obj[fn] === 'function') {
    const result = obj[fn].apply(self, args);

    // If the function returns a promise, hook in a callback function
    if (result && typeof result.then === 'function') {
      result.then((res: any) => {
        self.postMessage({ fn, uuid, result: res });
      }).catch((err: any) => {
        self.postMessage({ fn, uuid, error: err instanceof Error ? err.message : String(err) });
      });
    } else {
      self.postMessage({ fn, uuid, result });
    }
  } else {
    console.error(`Unknown function: ${fn}`);
  }
}
