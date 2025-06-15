import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import AboutPagePo from '@/cypress/e2e/po/pages/about.po';

const aboutPage = new AboutPagePo();

describe('Code Coverage', { testIsolation: 'off', tags: ['@coverageCheck', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  it('can navigate to About page to run coverage check function', () => {
    HomePagePo.goToAndWaitForGet();
    AboutPagePo.navTo();
    aboutPage.waitForPage();
  });
});
