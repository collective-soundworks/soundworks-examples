import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { render, html } from 'lit-html';
import '@ircam/simple-components/sc-button';
import { Client } from '@soundworks/core/client';
import initQoS from '@soundworks/template-helpers/client/init-qos.js';

import pluginPositionFactory from '@soundworks/plugin-position/client';

import PlayerExperience from './PlayerExperience.js';

const config = window.soundworksConfig;
// store experiences of emulated clients
const experiences = new Set();


async function launch($container, position, showPositionScreen) {
  try {
    const client = new Client();

    // -------------------------------------------------------------------
    // register plugins
    // -------------------------------------------------------------------
    client.pluginManager.register('position', pluginPositionFactory, {}, []);

    // -------------------------------------------------------------------
    // launch application
    // -------------------------------------------------------------------
    await client.init(config);
    initQoS(client);

    const experience = new PlayerExperience(client, config, $container, position, showPositionScreen);
    // store exprience for emulated clients
    experiences.add(experience);

    document.body.classList.remove('loading');

    // start all the things
    await client.start();
    experience.start();

    return Promise.resolve();
  } catch (err) {
    console.error(err);
  }
}

// -------------------------------------------------------------------
// bootstrapping
// -------------------------------------------------------------------
const $container = document.querySelector('#__soundworks-container');

render(html `
  <div style="padding: 20px;">
    <h1>@soundworks/plugin-position</h1>
    <p>
      <sc-button
        value="Open /controller"
        @input="${e => window.open('/controller', "MsgWindow", "width=1000,height=700")}"
      ></sc-button>
    </p>


    <section id="clients-container" style="
      display: block;
      width: 1000px;
      height: 100%;
    ">
    </section>
  </div>
`, $container);

const $clientsContainer = document.querySelector('#clients-container');
const searchParams = new URLSearchParams(window.location.search);

// enable instanciation of multiple clients in the same page to facilitate
// development and testing (be careful in production...)
const numEmulatedClients = parseInt(searchParams.get('emulate')) || 1;

if (numEmulatedClients > 1) {
  const numCols = 5;
  const numRows = Math.ceil(numEmulatedClients / numCols);

  for (let i = 0; i < numEmulatedClients; i++) {
    const x = (i % numCols + 1) / (numCols + 1);
    const y = Math.floor(i / numCols + 1) / (numRows + 1);

    const $div = document.createElement('div');
    $div.classList.add('emulate');
    $clientsContainer.appendChild($div);

    // modify y to put clients on a circular line to mimic a concert hall
    const yMod = ((2 * x - 1) ** 2) / (numRows + 1);
    const position = { x, y: y - yMod };
    launch($div, position, false);
  }
} else {
  const position = { x: 0.1 + 0.8 * Math.random(), y: 0.1 + 0.8 * Math.random() };
  launch($container, position, true);
}
