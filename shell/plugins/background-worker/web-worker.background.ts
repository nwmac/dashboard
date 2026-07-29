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

import { BackgroundWorkerApi } from '@shell/apis/intf/shell-api/bg-worker';

export type SendEventData = {
  fn: string;
  args: any[];
  uuid: string;
};

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
        self.postMessage({ fn, uuid, error: err });
      });
    } else {
      self.postMessage({ fn, uuid, result });
    }
  } else {
    console.error(`Unknown function: ${fn}`);
  }
}
