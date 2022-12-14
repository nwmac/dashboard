// Commands for the Rancher API

const JSON_CONTENT_TYPE = 'application/json';
const HEADER_ACCEPT = 'Accept';
const HEADER_CONTENT_TYPE = 'Content-Type';
const HEADER_CSRF = 'x-api-csrf';
const COOKIE_CSRF = 'CSRF';
const DASHBOARD_PATH = '/dashboard';

const { baseUrl } = Cypress.config();
let apiBase = baseUrl || '';

if (baseUrl?.endsWith(DASHBOARD_PATH)) {
  apiBase = baseUrl.substring(0, baseUrl.length - DASHBOARD_PATH.length);
}

Cypress.Commands.add('apiBase', () => apiBase);

// Set a user preference
Cypress.Commands.add('rancherSetPref', (id: string, value: string | null) => {
  return cy.request({
    url: `${ apiBase }/v1/management.cattle.io.settings/${ id }`,
    headers: { [HEADER_ACCEPT]: JSON_CONTENT_TYPE }
  }).then(r => {
    cy.getCookie(COOKIE_CSRF).then((cookie) => {
      const pref = r.body;

      pref.value = value;

      return cy.request({
        url:     `${ apiBase }/v1/management.cattle.io.settings/${ id }`,
        method:  'PUT',
        body:    JSON.stringify(pref),
        headers: {
          [HEADER_ACCEPT]:       JSON_CONTENT_TYPE,
          [HEADER_CONTENT_TYPE]: JSON_CONTENT_TYPE,
          [HEADER_CSRF]:         cookie?.value,
        }
      });
    });
  });
});

