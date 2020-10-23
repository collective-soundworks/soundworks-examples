import 'source-map-support/register';
import { Server } from '@soundworks/core/server';
import path from 'path';
import serveStatic from 'serve-static';
import compile from 'template-literal';

import pluginCheckinFactory from '@soundworks/plugin-checkin/server';

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

console.log(`
--------------------------------------------------------
- launching "${config.app.name}" in "${ENV}" environment
- [pid: ${process.pid}]
--------------------------------------------------------
`);

// -------------------------------------------------------------------
// register plugins
// -------------------------------------------------------------------
// for testing default options values
// server.pluginManager.register('checkin-default', pluginCheckinFactory, {}, []);
// server.pluginManager.get('checkin-default');

server.pluginManager.register('checkin', pluginCheckinFactory, {
  // order in which the tickets are assigned
  // defaults to 'ascending'
  order: 'ascending',
  // number of tickets that can be delivered, must be defined
  // if order is set to random
  capacity: 4,
  // data associated to each delivered index, if capacity is not defined
  // or data.length < capacity, capacity is set to data.length
  data: [
    { label: 'a', color: 'orange' },
    { label: 'b', color: 'orange' },
    { label: 'c', color: 'steelblue' },
    { label: 'd', color: 'steelblue' },
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
