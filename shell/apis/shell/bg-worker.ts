import { BackgroundWorkerApi } from '@shell/apis/intf/shell';
import { randomStr } from '@shell/utils/string';

/**
 * Messages received from the web worker
 */
export type ReceiveEventData = {
  uuid: string;
  result?: any;
  error?: any
};

/**
 * Defines an API for interacting with a background web worker.
 *
 * This class provides methods to send messages to the worker and perform actions.
 * It ensures that the worker is created and available before sending messages.
 *
 */
export class BackgroundWorkerApiProxy {
  private worker: Worker | null = null;

  private promises = new Map<string, { resolve: Function, reject: Function }>();

  public api: BackgroundWorkerApi;

  constructor(private store: any) {
    this.api = new Proxy({}, this);
  };

  public get(target: any, prop: any, receiver: any) {
    return (...args: any) => this.sendToWorker(prop, ...args);
  }

  /**
   * Ensure we have a web worker
   *
   * We don't create the web worker until we need it
   *
   */
  private ensureWorker() {
    if (!this.worker) {
      this.worker = this.store.backgroundCreateWorker() as Worker;

      // When we get a message back from the worker, resolve or reject the promise for that call, depending on the message
      this.worker.onmessage = (e: MessageEvent<ReceiveEventData>) => {
        if (e.data && e.data.uuid) {
          const { error, uuid, result } = e.data;
          const promise = this.promises.get(uuid);

          if (promise) {
            if (error) {
              promise.reject(error);
            } else {
              promise.resolve(result);
            }

            this.promises.delete(uuid);
          } else {
            // Warning: no promise found
            console.warn(`Background web worker: No promise found for uuid: ${ uuid }`); // eslint-disable-line no-console
          }
        }
      };
    }
  }
  
  private sendToWorker(fn: string, ...args: any[]) {
    this.ensureWorker();

    const uuid = randomStr();
    const promise = new Promise((resolve, reject) => {
      // Store the promise callbacks so we can resolve/reject when we get a message back from the worker
      this.promises.set(uuid, { resolve, reject });

      // Send the message to the worker
      this.worker?.postMessage({ fn, args, uuid });
    });

    return promise;
  }
}
