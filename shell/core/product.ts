import { IPlugin, IProducts, IProduct, PluginRouteConfig, ProductOptions, RouteLink } from '@shell/core/types';
import { RouteConfig } from 'vue-router';
import { DSL as STORE_DSL } from '@shell/store/type-map';
import DefaultProductComponent from './DefaultProductComponent.vue';
import ProductRedirect from './ProductRedirect.vue';

// Default resource handling views
import ListResource from '@shell/pages/c/_cluster/_product/_resource/index.vue';
import CreateResource from '@shell/pages/c/_cluster/_product/_resource/create.vue';
import ViewResource from '@shell/pages/c/_cluster/_product/_resource/_id.vue';
import ListNamespacedResource from '@shell/pages/c/_cluster/_product/_resource/_namespace/_id.vue';
import { BLANK_CLUSTER } from 'store';

export class Product implements IProduct {

  private store: any;
  private DSL: any;

  // Track changes made via the IProduct API and apply them once
  private routes: RouteConfig[] = [];
  private nav: {[key: string]: any}  = {};
  private virtualTypes: {[key: string]: any} = {};
  private basicTypes: string[] = [];

  constructor(store: any, public name: string) {
    this.store = store;
    this.DSL = STORE_DSL(this.store, this.name);
  }

  // Create the product
  public create(options: ProductOptions) {
    // Use legacy type-map to create the product

    // TODO: Mangle ProductOptions

    // Smallest set of defaults for the product to show up in 'Global Apps'
    this.DSL.product({
      icon:                'extension',
      category:            'global',
      inStore:             'management',
      removable:           false,
      showClusterSwitcher: false,
      ...options,
      to: {
        name: 'advanced',
        params: {
          product: 'advanced'
        }
      }
    });
  }

  addRoutes(routes: RouteConfig[]): void {
    this.routes.push(...routes);
  }

  addNavigation(routes: string | string[] | RouteLink | RouteLink[], grp?: string): void {
    // Undefined group means the root group
    const routesArray = Array.isArray(routes) ? routes : [routes];
    const group = grp || 'ROOT';

    if (!this.nav[group]) {
      this.nav[group] =[];
    }

    routesArray.forEach((route) => {
      if (typeof route === 'string') {
        // Type name
        this.nav[group].push(route);
        this.basicTypes.push(route);
      } else {
        const r = route as RouteLink;

        // RouteLink - so need to create a virtual type for the route
        // Store in a map, so other methods can update the virtual type
        // TODO: Do we allow user to configure a virtual type before adding the nav? If so, need to check here
        this.virtualTypes[r.name] = r;

        // Add name to the navigation
        this.nav[group].push(r.name);
      }
    });
  }

  // Internal - not exposed by the IProduct interface
  // Called by extensions system after product init - applies the routes and navigation to the store
  _apply(addRoutes: Function) {
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    console.error('Applying product types');
    console.log(this.routes);

    // Go through the virtual types and register those
    Object.keys(this.virtualTypes).forEach((name) => {
      const vt = this.virtualTypes[name];

      console.log(vt);

      this.DSL.virtualType({
        name:       vt.name,
        namespaced: false,
        labelKey:   'catalog.charts.header',
        icon:       'compass',
        weight:     100,
        label:      vt.name, // TODO: label key etc
        route:      {
          name:   `${ this.name }-${ vt.name }`,
          params: {
            product: this.name,
            cluster: BLANK_CLUSTER,
          }
        }
      })
    });

    // Navigation
    Object.keys(this.nav).forEach((grp) => {
      const group = grp === 'ROOT' ? undefined : grp;
      const items = this.nav[grp];

      this.DSL.basicType(items, group);

      console.log('Adding basic type');
      console.log(group);
      console.log(items);
    });

    // Figure out the default route for the product
    // let defaultRoute: any = { component: DefaultProductComponent };
    let defaultRoute: any = { component: ProductRedirect };
    // let defaultRoute: any = {};

    if (this.nav['ROOT'] && this.nav['ROOT'].length > 0) {
      const first = this.nav['ROOT'][0];

      let redirect = first;

      // Can be a string or a Route
      if (typeof redirect === 'string') {
        console.warn(redirect);
        redirect = {
          name: `${ this.name }-${ redirect }`,
          //name: `${ redirect }`,
          path: `${ redirect }`,
          params: {
            product: this.name,
            cluster: BLANK_CLUSTER,
          }
        };
      } else {
        console.log('*************************************************************************************************');
        console.error('>>>>>>> ERROR >>>>>>>>>>>');
      }

      defaultRoute.meta = {
        redirect: redirect
      };
    }

    defaultRoute.meta = defaultRoute.meta || {};
    defaultRoute.meta.product = this.name;
    defaultRoute.meta.cluster = BLANK_CLUSTER;

    console.log(defaultRoute);

    // Ensure the route has the blank cluster, otherwise the default layout won't think the cluster and won't load
    defaultRoute.params = defaultRoute.params || {};
    defaultRoute.params.product = this.name;
    defaultRoute.params.cluster = BLANK_CLUSTER;
    defaultRoute.params.cluster = BLANK_CLUSTER;

    // Update the names of the child routes (should be recursive)
    // Names are always absolute - child names are not within the context of the parent
    // Prepend name
    this.routes.forEach((r) => {
      if (r.name) {
        r.name = `${ this.name }-${ r.name }`;
      }

      r.path = `/${ this.name }/${ r.path }`;
    });

    // Routes
    // Add top-level route for the product
    const productRoutes = [{
      route: {
        name: `${ this.name }`,
        path: `/${ this.name }`,
        children: [],
        ...defaultRoute,
      }
    }];

    const allRoutesToAdd = [
      ...this.routes
    ];

    console.log(allRoutesToAdd);

    // If basic types are used, then add routes for types - List, Detail, Edit
    if (this.basicTypes.length > 0) {
      const typeRoutes: any[] = [
        {
          name:      `${ this.name }-c-cluster-resource`,
          path:      `/${ this.name }/c/:cluster/:resource`,
          component: ListResource,
        },
        {
          name:      `${ this.name }-c-cluster-resource-create`,
          path:      `/${ this.name }/c/:cluster/:resource/create`,
          component: CreateResource,
        },
        {
          name:      `${ this.name }-c-cluster-resource-id`,
          path:      `/${ this.name }/c/:cluster/:resource/:id`,
          component: ViewResource,
        },
        {
          name:      `${ this.name }-c-cluster-resource-namespace-id`,
          path:      `/${ this.name }c/:cluster/:resource/:namespace/:id`,
          component: ListNamespacedResource,        
        }
      ];
    
      allRoutesToAdd.push(...typeRoutes);

      //productRoutes[0].route.children = allRoutesToAdd;

    }

    const extRoutes: any[] = [];

    allRoutesToAdd.forEach((r: any) => {
      r.params = {
        product: this.name,
        cluster: BLANK_CLUSTER,
      };

      // Add metadata

      r.meta = r.meta || {};
      r.meta.product = this.name;
      r.meta.cluster = BLANK_CLUSTER;

      extRoutes.push({
        route: r
      });
    });

    console.log('ADD');
    console.error(extRoutes);

    addRoutes(extRoutes);
    addRoutes(productRoutes);
  }
  
  // // NEW WORK!!!!
  // private _updateType(entry: any) {
  //   const {
  //     configureType,
  //     virtualType,
  //     weightType,
  //     weightGroup,
  //     headers,
  //     basicType,
  //     spoofedType
  //   } = this.dslMethods;
  //   // STILL MISSING: spoofedType...

  //   console.log('******* START --------------------------------------------------- *************');
  //   console.log('_updateType', entry);

  //   // apply menu registration (types, headers, weights)
  //   // no ID, no funny...
  //   if (!entry.id) {
  //     // eslint-disable-next-line no-console
  //     console.error('you are missing the registration identifier (id)!');

  //     return false;
  //   }

  //   // registering a resource
  //   if (entry.type === 'resource') {
  //     configureType(entry.id, entry.options || {});
  //   // registering a custom page or a virtual resource
  //   } else if (entry.type === 'custom-page' || entry.type === 'virtual-resource') {
  //     const options = entry.options || {};

  //     // inject the ID as name... needed for virtualType and spoofedType
  //     if (entry.id && !options.name) {
  //       options.name = entry.id;
  //     }

  //     if (entry.type === 'custom-page') {
  //       virtualType(options);
  //     } else if (entry.type === 'virtual-resource') {
  //       if (entry.id && !options.type) {
  //         options.type = entry.id;
  //       }
  //       spoofedType(options);
  //     }
  //   }

  //   // register headers
  //   if (entry.listCols && Array.isArray(entry.listCols)) {
  //     console.log('registering headers', entry.id, entry.listCols);
  //     headers(entry.id, entry.listCols);
  //   }

  //   // prepare data for basicType (registering menu entries)
  //   if (entry.menuGroupingId) {
  //     if (!this.menuGrouping[entry.menuGroupingId]) {
  //       this.menuGrouping[entry.menuGroupingId] = { menuItems: [entry.id] };
  //     } else {
  //       this.menuGrouping[entry.menuGroupingId].menuItems.push(entry.id);
  //     }

  //     if (entry.menuGroupingWeight && parseInt(entry.menuGroupingWeight) >= 0) {
  //       this.menuGrouping[entry.menuGroupingId].weight = entry.menuGroupingWeight;
  //     }
  //   } else {
  //     if (!this.singleMenuEntry[entry.id]) {
  //       this.singleMenuEntry[entry.id] = {};
  //     }

  //     if (entry.options?.weight && parseInt(entry.options?.weight) >= 0) {
  //       this.singleMenuEntry[entry.id].weight = entry.options?.weight;
  //     }
  //   }

  //   // console.log('singleMenuEntry', this.singleMenuEntry);
  //   // console.log('menuGrouping', this.menuGrouping);
  //   console.log('******* --------------------------------------------------- END *************');

  //   // register menu entries for non-grouped resources
  //   Object.keys(this.singleMenuEntry).forEach((key) => {
  //     basicType(Object.keys(this.singleMenuEntry));

  //     if (this.singleMenuEntry[key].weight) {
  //       weightType(key, this.singleMenuEntry[key].weight, true);
  //     }
  //   });

  //   // register menu entries for grouped resources
  //   Object.keys(this.menuGrouping).forEach((key) => {
  //     basicType(this.menuGrouping[key].menuItems, key);

  //     if (this.menuGrouping[key].weight) {
  //       weightGroup(key, this.menuGrouping[key].weight, true);
  //     }
  //   });

  //   return true;
  // }

  // // NEW WORK!!!!
  // registerType(entries: [any]) {
  //   console.log('registerType entries', entries);

  //   // apply menu registration (types, headers, weights)
  //   for (let i = 0; i < entries.length; i++) {
  //     const res = this._updateType(entries[i]);

  //     if (!res) {
  //       continue;
  //     }
  //   }
  // }

  // // NEW WORK!!!!
  // updateType(entry: any) {
  //   this._updateType(entry);
  // }


}
