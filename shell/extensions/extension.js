export default function({
  app,
  store,
  $axios,
  redirect
}, inject) {
  const models = {};

  inject('extension', {
    registerModel(name, model) {
      console.log('registerModel'); // eslint-disable-line no-console
      console.log(name); // eslint-disable-line no-console

      models[name] = model;
    },

    getModel(name) {
      return models[name];
    },

    load(name, mainFile) {
      const router = app.router;
      const moduleUrl = mainFile;
      const element = document.createElement('script');

      element.src = moduleUrl;
      element.type = 'text/javascript';
      element.async = true;

      element.onload = () => {
        element.parentElement.removeChild(element);
        window[name].default(router, store, this);
      };

      element.onerror = () => {
        element.parentElement.removeChild(element);
      };

      document.head.appendChild(element);
    }
  });
}
