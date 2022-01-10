import 'source-map-support/register';
import { Server } from '@soundworks/core/server';
import path from 'path';
import serveStatic from 'serve-static';
import compile from 'template-literal';

import getConfig from '../utils/getConfig.js';

import pluginPlatformFactory from '@soundworks/plugin-platform/server';
import pluginAudioStreamsFactory from '@soundworks/plugin-audio-streams/server';
import pluginSyncFactory from '@soundworks/plugin-sync/server';

import globalsSchema from './schemas/globals.js';

import PlayerExperience from './PlayerExperience.js';
const ENV = process.env.ENV || 'default';
const config = getConfig(ENV);
const server = new Server();

// html template and static files (in most case, this should not be modified)
server.templateEngine = { compile };
server.templateDirectory = path.join('.build', 'server', 'tmpl');
server.router.use(serveStatic('public'));
server.router.use('build', serveStatic(path.join('.build', 'public')));
server.router.use('vendors', serveStatic(path.join('.vendors', 'public')));
server.router.use('/streams/audio-streams', serveStatic('.data/streams/audio-streams'));

console.log(`
--------------------------------------------------------
- launching "${config.app.name}" in "${ENV}" environment
- [pid: ${process.pid}]
--------------------------------------------------------
`);

// -------------------------------------------------------------------
// register plugins
// -------------------------------------------------------------------

server.pluginManager.register('platform', pluginPlatformFactory, {}, []);
server.pluginManager.register('audio-streams', pluginAudioStreamsFactory, {
  directory: 'streams',
  cache: true,
}, []);

server.pluginManager.register('sync', pluginSyncFactory, {}, []);

// -------------------------------------------------------------------
// register schemas
// -------------------------------------------------------------------
server.stateManager.registerSchema('globals', globalsSchema);


(async function launch() {
  try {
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
          subpath: config.env.subpath,
        }
      };
    });

    const sync = server.pluginManager.get('sync');

    server.stateManager.registerUpdateHook('globals', updates => {
      updates.toggleStream.syncTime = sync.getSyncTime() + 0.1;
      return updates;
    });

    const globals = await server.stateManager.create('globals');

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
