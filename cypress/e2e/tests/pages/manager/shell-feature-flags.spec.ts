import ClusterManagerListPagePo from '@/cypress/e2e/po/pages/cluster-manager/cluster-manager-list.po';
import { NodesPagePo } from '@/cypress/e2e/po/pages/explorer/nodes.po';

type ShellFeatureFlags = {
  clusterShell?: boolean;
  nodeShell?: boolean;
  podShell?: boolean;
};

const clusterList = new ClusterManagerListPagePo();
const nodesPage = new NodesPagePo('local');

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

describe('Shell Feature Flags (Manager)', { tags: ['@manager', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('shows cluster shell action when cluster-shell is enabled', () => {
    stubShellFeatureFlags({ clusterShell: true });

    clusterList.goTo();
    clusterList.waitForPage();
    cy.wait('@shellFeatureFlags');

    clusterList.list().actionMenu('local').getMenuItem('Kubectl Shell').should('exist');
  });

  it('hides cluster shell action when cluster-shell is disabled', () => {
    stubShellFeatureFlags({ clusterShell: false });

    clusterList.goTo();
    clusterList.waitForPage();
    cy.wait('@shellFeatureFlags');

    clusterList.list().actionMenu('local').getMenuItem('Kubectl Shell').should('not.exist');
  });

  it('shows node shell action when node-shell is enabled', () => {
    stubShellFeatureFlags({ nodeShell: true });

    nodesPage.goTo();
    nodesPage.waitForPage();
    cy.wait('@shellFeatureFlags');

    nodesPage.nodesList().resourceTable().sortableTable().rowNames('td.col-link-detail')
      .then((names) => {
        expect(names.length).to.be.greaterThan(0);

        const firstNodeName = names[0].trim();

        nodesPage.nodesList().actionMenu(firstNodeName).getMenuItem('SSH Shell').should('exist');
      });
  });

  it('hides node shell action when node-shell is disabled', () => {
    stubShellFeatureFlags({ nodeShell: false });

    nodesPage.goTo();
    nodesPage.waitForPage();
    cy.wait('@shellFeatureFlags');

    nodesPage.nodesList().resourceTable().sortableTable().rowNames('td.col-link-detail')
      .then((names) => {
        expect(names.length).to.be.greaterThan(0);

        const firstNodeName = names[0].trim();

        nodesPage.nodesList().actionMenu(firstNodeName).getMenuItem('SSH Shell').should('not.exist');
      });
  });
});
