import { WorkloadsPodsListPagePo } from '@/cypress/e2e/po/pages/explorer/workloads-pods.po';
import { WorkloadsDeploymentsListPagePo } from '@/cypress/e2e/po/pages/explorer/workloads/workloads-deployments.po';
import { createPodBlueprint } from '@/cypress/e2e/blueprints/explorer/workload-pods';
import { createDeploymentBlueprint } from '@/cypress/e2e/blueprints/explorer/workloads/deployments/deployment-create';

type ShellFeatureFlags = {
  clusterShell?: boolean;
  nodeShell?: boolean;
  podShell?: boolean;
};

const podsListPage = new WorkloadsPodsListPagePo('local');
const deploymentsListPage = new WorkloadsDeploymentsListPagePo('local');

const stubShellFeatureFlags = ({
  clusterShell = true,
  nodeShell = true,
  podShell = true,
}: ShellFeatureFlags = {}) => {
  const setFeature = (data: any[], name: string, value: boolean) => {
    const entry = data.find((feature) => feature?.metadata?.name === name);

    if (entry) {
      entry.spec = entry.spec || {};
      entry.spec.value = value;
    }
  };

  cy.intercept({
    method:   'GET',
    pathname: '/v1/management.cattle.io.features',
  }, (req) => {
    req.continue((res) => {
      const features = res.body?.data;

      if (!Array.isArray(features)) {
        return;
      }

      setFeature(features, 'cluster-shell', clusterShell);
      setFeature(features, 'node-shell', nodeShell);
      setFeature(features, 'pod-shell', podShell);
    });
  }).as('shellFeatureFlags');
};

describe('Shell Feature Flags (Explorer Workloads)', { tags: ['@explorer2', '@adminUser'] }, () => {
  let podName = '';
  let deploymentName = '';

  before(() => {
    cy.login();

    cy.createE2EResourceName('shell-pod').then((name) => {
      podName = name;

      const pod: any = structuredClone(createPodBlueprint);

      pod.metadata.name = podName;
      cy.createRancherResource('v1', 'pods', JSON.stringify(pod), false);
      cy.waitForRancherResource('v1', 'pods', `default/${ podName }`, (resp: any) => resp.status === 200);
    });

    cy.createE2EResourceName('shell-deploy').then((name) => {
      deploymentName = name;

      const deployment: any = structuredClone(createDeploymentBlueprint);

      deployment.metadata.name = deploymentName;
      cy.createRancherResource('v1', 'apps.deployment', JSON.stringify(deployment), false);
      cy.waitForRancherResource('v1', 'apps.deployment', `default/${ deploymentName }`, (resp: any) => resp.status === 200);
    });
  });

  beforeEach(() => {
    cy.login();
  });

  after(() => {
    if (podName) {
      cy.deleteRancherResource('v1', 'pods', `default/${ podName }`, false);
    }

    if (deploymentName) {
      cy.deleteRancherResource('v1', 'apps.deployment', `default/${ deploymentName }`, false);
    }
  });

  it('shows pod/workload shell actions when pod-shell is enabled', () => {
    stubShellFeatureFlags({ podShell: true });

    podsListPage.goTo();
    podsListPage.waitForPage();
    cy.wait('@shellFeatureFlags');
    podsListPage.list().actionMenu(podName).getMenuItem('Execute Shell').should('exist');

    deploymentsListPage.goTo();
    deploymentsListPage.waitForPage();
    deploymentsListPage.resourcesList().actionMenu(deploymentName).getMenuItem('Execute Shell').should('exist');
  });

  it('hides pod/workload shell actions when pod-shell is disabled', () => {
    stubShellFeatureFlags({ podShell: false });

    podsListPage.goTo();
    podsListPage.waitForPage();
    cy.wait('@shellFeatureFlags');
    podsListPage.list().actionMenu(podName).getMenuItem('Execute Shell').should('not.exist');

    deploymentsListPage.goTo();
    deploymentsListPage.waitForPage();
    deploymentsListPage.resourcesList().actionMenu(deploymentName).getMenuItem('Execute Shell').should('not.exist');
  });
});
