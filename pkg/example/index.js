import { parse } from '@shell/utils/url';
import Test from './pages/test';
import { hello } from './neil';

// Init the package - this function will be passed the Extension API

export default function(router, store, $extension) {
  console.log('Example pkg init'); // eslint-disable-line no-console
  console.log($extension); // eslint-disable-line no-console

  router.addRoute({
    path:      '/test',
    name:      'test',
    component: Test
  });

  store.commit('nav/addNav', {
    id:    'example',
    label: 'Example',
    icon:  'icon-gear',
    route: { name: 'test' }
  });

  console.log('Loaded Example pkg'); // eslint-disable-line no-console

  hello('okay!');
  parse();
}
