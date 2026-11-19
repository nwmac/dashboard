/**
 * A persona is a role-oriented view of the UI (e.g. an app developer sees a different emphasis to a
 * security admin). A user may have access to one or more personas and switch between them.
 *
 * For now this is a static list. In time it will be configurable and drive other aspects of the UI.
 */
export interface Persona {
  id: string;
  /** Translation key for the persona's display name */
  labelKey: string;
  /** Translation key for a short description of the persona */
  descriptionKey: string;
  /** Rancher icon font class, without the `icon-` prefix */
  icon: string;
  /** Background colour of the persona's avatar */
  color: string;
}

export const PERSONAS: Persona[] = [
  {
    id:             'cluster-admin',
    labelKey:       'persona.clusterAdmin.label',
    descriptionKey: 'persona.clusterAdmin.description',
    icon:           'cluster',
    color:          '#3d98d3',
  },
  {
    id:             'app-developer',
    labelKey:       'persona.appDeveloper.label',
    descriptionKey: 'persona.appDeveloper.description',
    icon:           'code',
    color:          '#5a9a3c',
  },
  {
    id:             'security-admin',
    labelKey:       'persona.securityAdmin.label',
    descriptionKey: 'persona.securityAdmin.description',
    icon:           'lock',
    color:          '#c0392b',
  },
];

export const DEFAULT_PERSONA_ID = PERSONAS[0].id;
