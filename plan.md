Phase 1 - Individual UI code bases
- Remove nuxt (.nuxt -> nuxt + fixes) - check latest 2.15.8 code
- Refactor code base
- Update to Webpack 5
- TODO:
  - Translations
  - Assets
  - Pick apart packages
  - Pull out Cluster Explorer code
  - Pull out Fleet code
  - Pull our Cluster Management code
  - Pull out Harvester code
  - Pull out Apps and Marketplace code
- Move UI code for Harvester to separate GitHub repos
- Populate Epinio, Opni, Kubewarden UI repos with code from dashboard codebase
- Validate Harvester use case - ability to load UI from Harvester cluster
- Validate Dashboard functions correctly
- Define and implement initial plugin interface - can we do this in Typescript?
- Illustrative empty app shell

Phase 2 - Modularity - ability to add code and runtime
- Understand nuxt code and figure out how to remove/replace it for long-term support
- Understand what it will take to move to Vue 3
- Add plugins view to allow plugins to be added/removed/updated

Documentation & Examples
- Dashboard index config - what to do about this?

Framework
- e2e tests
- unit tests

Locasl Dashboard
- Alpha version quickly
- Figure out how to do Apps and Marketplace on desktop (leverage Stratos code?)
- Can we switch kube contexts in Steve, or does it need to be restarted?

Backend
- Leverage Stratos backend
- For local dashboard + standalone UIs
- Can we leverage a standard go auth package?
- Wrap as Helm chart
- Keep the jetstream nanme?

TODO
- Name for foundation - need .io, GitHub and npm availability

Demos
- Add and upgrade Fleet as a separate UI
- Harvester, loading cluster UI from remote Harvester Cluster
- Creating, deploying, updating a simple plugin from scratch
- Creating a new UI from scratch, branding it etc - e.g. standalone Fleet UI
- Next:
  - Adding a language pack
  - Adding a new theme
  - 