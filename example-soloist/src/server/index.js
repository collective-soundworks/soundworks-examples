import 'source-map-support/register';
import { Server } from '@soundworks/core/server';
import path from 'path';
import serveStatic from 'serve-static';
import compile from 'template-literal';

import pluginPositionFactory from '@soundworks/plugin-position/server';

import playerSchema from './schemas/player';
import controllerSchema from './schemas/controller';

import PlayerExperience from './PlayerExperience.js';
import ControllerExperience from './ControllerExperience.js';

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

const xRange = [0, 1];
const yRange = [0, 1];

// -------------------------------------------------------------------
// register plugins
// -------------------------------------------------------------------
server.pluginManager.register('position', pluginPositionFactory, {
  xRange,
  yRange,
  backgroundImage: 'images/seating-map.png',
}, []);

// -------------------------------------------------------------------
// register schemas
// -------------------------------------------------------------------
server.stateManager.registerSchema('player', playerSchema);
server.stateManager.registerSchema('controller', controllerSchema);


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
    const controllerExperience = new ControllerExperience(server, 'controller');

    const controllerState = await server.stateManager.create('controller', {
      xRange,
      yRange,
    });

    await server.start();
    playerExperience.start();
    controllerExperience.start();

    // ------------------------------------------------------------------
    // link controller to players
    // ------------------------------------------------------------------
    const playerStates = new Set();

    function getNormalizedDistance(center, target, radius) {
      const dx = target.x - center.x;
      const dy = target.y - center.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const normDistance = Math.min(1, distance / radius);

      return normDistance;
    }

    // attach to players states to be able to update their distance
    server.stateManager.observe(async (schemaName, nodeId) => {
      if (schemaName === 'player') {
        const playerState = await server.stateManager.attach(schemaName, nodeId);

        playerState.onDetach(() => playerStates.delete(playerState));
        playerStates.add(playerState);
      }
    });

    controllerState.subscribe(updates => {
      for (let key in updates) {
        switch (key) {
          case 'pointers':
            {
              const pointers = updates[key];
              const radius = controllerState.get('radius');

              if (pointers.length === 0) {
                for (let playerState of playerStates) {
                  playerState.set({ distance: 1 });
                };
              } else {
                for (let playerState of playerStates) {
                  for (let pointersPosition of pointers) {
                    const playerPosition = playerState.get('position');
                    const normDistance = getNormalizedDistance(pointersPosition, playerPosition, radius);

                    playerState.set({ distance: normDistance });
                  };
                };
              }
              break;
            }
        }
      }
    });

    // const udpPort = new osc.UDPPort({
    //     localAddress: '127.0.0.1',
    //     localPort: 57121,
    //     metadata: true
    // });

    // udpPort.on('message', msg => {
    //   switch (msg.address) {
    //     case '/trigger': {
    //       const position = {
    //         x: msg.args[0].value,
    //         y: msg.args[1].value,
    //       }
    //       soloistState.set({ pointers: [position] });
    //     }
    //   }
    // });

    // udpPort.open();

  } catch (err) {
    console.error(err.stack);
  }
})();

process.on('unhandledRejection', (reason, p) => {
  console.log('> Unhandled Promise Rejection');
  console.log(reason);
});
