import { BackgroundWorkerApi } from '@shell/apis/intf/shell-api/bg-worker';
import { BackgroundWorkerApiProxy } from '@shell/apis/shell/bg-worker';
import { NotificationHandlerExtensionName, NotificationLevel, Notification } from '@shell/types/notifications';

export const CLUSTER_PROVISIONING_HANDLER_NAME = 'cluster-provisioning';

/**
 * Lazily-created singleton proxy for the background worker, scoped to this handler.
 * Using a module-level variable ensures all concurrent `monitorTask` calls share one worker.
 */
let bgWorkerProxy: BackgroundWorkerApi | null = null;

function getBgWorker(store: any): BackgroundWorkerApi {
  if (!bgWorkerProxy) {
    bgWorkerProxy = new BackgroundWorkerApiProxy(store).api;
  }

  return bgWorkerProxy;
}

function createHandler(store: any) {
  return {
    onReadUpdated(_notification: Notification, _read: boolean) {
      // No special behaviour needed when the notification is read/unread.
    },

    async monitorTask(notification: Notification) {
      const { resourceUrl, clusterName } = notification.data || {};

      if (!resourceUrl || !clusterName) {
        console.warn('cluster-provisioning handler: missing resourceUrl or clusterName in notification data'); // eslint-disable-line no-console

        return;
      }

      try {
        await getBgWorker(store).watchResource({
          resourceUrl,
          options: {
            pollInterval: 5_000,
            timeout:      30 * 60 * 1_000,
            // Provisioning cluster is ready when status.conditions contains { type: 'Ready', status: 'True' }
            successCondition: {
              path:      'status.conditions',
              matchItem: { type: 'Ready' },
              field:     'status',
              equals:    'True',
            },
          },
        });

        await store.dispatch('notifications/update', {
          id:    notification.id,
          level: NotificationLevel.Success,
          title: `Cluster "${ clusterName }" provisioned successfully`,
        });
      } catch (e: any) {
        const timedOut = typeof e === 'string'
          ? e.includes('timed out')
          : e?.message?.includes('timed out');

        await store.dispatch('notifications/update', {
          id:    notification.id,
          level: NotificationLevel.Error,
          title: timedOut
            ? `Cluster "${ clusterName }" provisioning timed out`
            : `Cluster "${ clusterName }" provisioning failed`,
        });
      }
    },
  };
}

/**
 * Plugin entry-point. Registers the cluster provisioning notification handler so the notification
 * store can call `monitorTask` when a provisioning task notification is added or loaded.
 */
export default function(context: any) {
  const { store, $extension } = context;

  $extension.register(
    NotificationHandlerExtensionName,
    CLUSTER_PROVISIONING_HANDLER_NAME,
    createHandler(store)
  );
}
