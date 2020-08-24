import 'source-map-support/register';
import { Server } from '@soundworks/core/server';
import path from 'path';
import util from 'util';
import serveStatic from 'serve-static';
import compile from 'template-literal';

import pluginFilesystemFactory from '@soundworks/plugin-filesystem/server';

import PlayerExperience from './PlayerExperience.js';

import getConfig from './utils/getConfig.js';
const ENV = process.env.ENV || 'default';
const config = getConfig(ENV);
const server = new Server();

// html template and static files (in most case, this should not be modified)
server.templateEngine = { compile };
server.templateDirectory = path.join('.build', 'server', 'tmpl');
server.router.use(serveStatic('public'));
server.router.use('build', serveStatic(path.join('.build', 'public')));
server.router.use('vendors', serveStatic(path.join('.vendors', 'public')));

console.log('> exposing directory "fs-watch" as "public-watch" route');
server.router.use('fs-public', serveStatic('fs-watch'));

server.router.use('fs-outside',
  serveStatic(path.join(process.cwd(), '../plugin-filesystem-outside-dir')));

console.log(`
--------------------------------------------------------
- launching "${config.app.name}" in "${ENV}" environment
- [pid: ${process.pid}]
--------------------------------------------------------
`);

// -------------------------------------------------------------------
// register plugins
// -------------------------------------------------------------------
server.pluginManager.register('filesystem', pluginFilesystemFactory, {
  directories: [
    {
      name: 'fs-new',
      path: path.join(process.cwd(), 'fs-new'),
      publicDirectory: 'fs-new',
    },
    {
      name: 'fs-abs',
      path: path.join(process.cwd(), 'fs-watch'),
      publicDirectory: 'fs-public',
    },
    {
      name: 'fs-rel',
      path: 'fs-watch',
      publicDirectory: 'fs-public',
    },
    {
      name: 'fs-outside',
      path: path.join(process.cwd(), '../plugin-filesystem-outside-dir'),
      publicDirectory: 'fs-outside',
    },
  ],
}, []);

// -------------------------------------------------------------------
// register schemas
// -------------------------------------------------------------------
// server.stateManager.registerSchema(name, schema);


(async function launch() {
  try {
    // @todo - check how this behaves with a node client...
    await server.init(config, (clientType, config, httpRequest) => {
      return {
        clientType: clientType,
        app: {
          name: config.app.name,
          author: config.app.author,
        },
        env: {
          type: config.env.type,
          websockets: config.env.websockets,
          assetsDomain: config.env.assetsDomain,
        }
      };
    });

    const filesystem = await server.pluginManager.get('filesystem');

    const playerExperience = new PlayerExperience(server, 'player');

    // start all the things
    await server.start();
    playerExperience.start();

  } catch (err) {
    console.error(err.stack);
  }
})();

process.on('unhandledRejection', (reason, p) => {
  console.log('> Unhandled Promise Rejection');
  console.log(reason);
});
