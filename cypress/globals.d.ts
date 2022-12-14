type Matcher = '$' | '^' | '~' | '*' | '';

// To be defined
type UserPreferences = any;

// eslint-disable-next-line no-unused-vars
declare namespace Cypress {
  interface Chainable {
    login(username?: string, password?: string, cacheSession?: boolean): Chainable<Element>;
    byLabel(label: string,): Chainable<Element>;

    /**
     *  Wrapper for cy.get() to simply define the data-testid value that allows you to pass a matcher to find the element.
     * @param id Value used for the data-testid attribute of the element.
     * @param matcher Matching character used for attribute value:
     * - `$`: Suffixed with this value
     * - `^`: Prefixed with this value
     * - `~`: Contains this value as whitespace separated words
     * - `*`: Contains this value
     */
    getId(id: string, matcher?: Matcher): Chainable<Element>;

    /**
     *  Wrapper for cy.find() to simply define the data-testid value that allows you to pass a matcher to find the element.
     * @param id Value used for the data-testid attribute of the element.
     * @param matcher Matching character used for attribute value:
     * - `$`: Suffixed with this value
     * - `^`: Prefixed with this value
     * - `~`: Contains this value as whitespace separated words
     * - `*`: Contains this value
     */
    findId(id: string, matcher?: Matcher): Chainable<Element>;

    /**
     * Override user preferences to default values, allowing to pass custom preferences for a deterministic scenario
     * Leave empty for reset to default values
     */
    userPreferences(preferences?: Partial<UserPreferences>): Chainable<null>;

    /**
     * Set a user preference via the Rancher API
     * 
     * @param id ID of the preference
     * @param value Nwe value for the preference (or null to clear)
     */
    rancherSetPref(id: string, value: string | null): Chainable<Cypress.Response<any>>;

    // Returns the base URL for API calls (removing /dashboard from the test base url, for example)
    apiBase(): string;
  }
}
