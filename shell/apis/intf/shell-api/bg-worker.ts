/**
 * Condition to evaluate against a fetched resource.
 *
 * Simple path equality:
 *   { path: 'status.phase', equals: 'Running' }
 *
 * Array-item match (find item where all matchItem pairs hold, then check a field on that item):
 *   { path: 'status.conditions', matchItem: { type: 'Ready' }, field: 'status', equals: 'True' }
 */
export interface WatchCondition {
  /**
   * Dot-notation path into the resource object, e.g. 'status.conditions'
   */
  path: string;
  /**
   * For array paths: find the first element where every key-value pair in this object matches.
   * If omitted the resolved value is compared directly via `equals`.
   */
  matchItem?: Record<string, any>;
  /**
   * When `matchItem` is set: the field on the matched element to compare against `equals`.
   */
  field?: string;
  /**
   * Expected value. Compared via strict equality (===).
   */
  equals?: any;
}

/**
 * Options for {@link BackgroundWorkerApi.watchResource}.
 */
export interface WatchResourceOptions {
  /** Condition that resolves the watch. Required. */
  successCondition: WatchCondition;
  /** Condition that rejects the watch immediately. Optional. */
  errorCondition?: WatchCondition;
  /** How often to poll, in milliseconds. Defaults to 5 000. */
  pollInterval?: number;
  /** Total watch lifetime in milliseconds before a timeout rejection is raised. Defaults to 1 800 000 (30 min). */
  timeout?: number;
}

/**
 * Argument passed to {@link BackgroundWorkerApi.watchResource}.
 */
export interface WatchResourceRequest {
  /** Absolute path (e.g. `/v1/provisioning.cattle.io.clusters/fleet-default/my-cluster`) or full URL to poll. */
  resourceUrl: string;
  options: WatchResourceOptions;
}

/**
 * Interface that the background web worker implements
 */
export interface BackgroundWorkerApi {
  doSomething(msg: string): Promise<string>;
  wait(s: number): Promise<string>;
  /**
   * Poll `resourceUrl` on the given interval until `successCondition` is met, `errorCondition`
   * fires, or the timeout elapses.
   *
   * Resolves (void) on success. Rejects with an Error on error-condition or timeout.
   */
  watchResource(request: WatchResourceRequest): Promise<void>;
}
