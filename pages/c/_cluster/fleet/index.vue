<script>
import { NAME } from '@shell/config/product/fleet';
import { FLEET } from '@shell/config/types';

export default {
  middleware({ redirect, route } ) {
    return redirect({
      name:   'c-cluster-product-resource',
      params: {
        ...route.params,
        product:  NAME,
        resource: FLEET.GIT_REPO,
      }
    });
  }
};

</script>

<template>
  <div>This is Fleet.</div>
</template>
