import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import { MonitoringTab } from './monitoring-tab.po';

export class IstioTab extends MonitoringTab {
  tabID(): string {
    return 'istio';
  }

  enableIngressGatewayCheckbox(): CheckboxInputPo {
    return new CheckboxInputPo(cy.get('span.checkbox-label').contains('Enable Ingress Gateway').parent().parent());
  }
}
