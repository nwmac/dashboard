/**
 * Interface that the background web worker implements
 */
export interface BackgroundWorkerApi {
  doSomething(msg: string): Promise<string>;
  wait(s: number): Promise<string>;
}
