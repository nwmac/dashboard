import { IPlugin, IProducts, IProduct, ProductOptions, PluginRouteConfig } from '@shell/core/types';
import { Product } from './product';
import { RouteConfig } from 'vue-router';
import { BLANK_CLUSTER } from 'store';

export class Products implements IProducts {

  private store: any;

  public products:any[] = [];

  constructor(store: any) {
    this.store = store;
  }

  add(name: string, options?: ProductOptions): IProduct {
    const product = new Product(this.store, name);

    // Set the default route
    const opts = {
      // to: {
      //   name:   `c-cluster-product`,
      //   params: {
      //     cluster: BLANK_CLUSTER,
      //     product: name
      //   }
      // },
      to: {
        name:   name,
        params: {
          product: name
        }
      },
      ...options
    };

    product.create(opts);

    this.products.push(product);

    return product;
  }

  get(name: string): IProduct {
    // TOD: Check product exists
    return new Product(this.store, name);
  }
}
