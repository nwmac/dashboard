import path from 'path';

// const SHELL = path.resolve(__dirname, '..', 'shell');
const SHELL = __dirname;

console.log(SHELL); // eslint-disable-line no-console

export default {
  configure(config, ctx) {
    config.module.rules.forEach((rule) => {
      if ('file.scss'.match(rule.test)) {
        rule.oneOf.forEach((r) => {
          r.use.forEach((loader) => {
            if (loader.loader.includes('sass-loader')) {
              loader.options.sassOptions = {
                importer: (url, prev, done) => {
                  console.log(`RESOLVE: ${ url }`); // eslint-disable-line no-console
                  if (url.indexOf('~shell/assets/') === 0) {
                    const u = url.substr(7);

                    return done({ file: path.join(SHELL, u) });
                  } else if (url.indexOf('~shell/') === 0) {
                    const u = url.substr(7);

                    console.log(`${ url } > ${ path.join(SHELL, u) }`); // eslint-disable-line no-console

                    return done({ file: path.join(SHELL, u) });
                  }
                  done(null);
                }
              };
            }
          });
        });
      }
    });
  }
};
