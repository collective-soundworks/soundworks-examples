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


async function launch($container, position) {
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

    const experience = new PlayerExperience(client, config, $container, position);
    // store exprience for emulated clients
    experiences.add(experience);

    document.body.classList.remove('loading');

    // start all the things
    await client.start();
    experience.start();

    return Promise.resolve();
  } catch(err) {
    console.error(err);
  }
}

// -------------------------------------------------------------------
// bootstrapping
// -------------------------------------------------------------------
const $container = document.querySelector('#__soundworks-container');

render(html`
  <div style="padding: 20px;">
    <h1>@soundworks/plugin-location</h1>
    <p>
      This page instanciated 20 clients with a position defined on a 5 x 4 matrix
      <br />
      <sc-button
        value="Open /controller"
        @input="${e => window.open('/controller', "MsgWindow", "width=1000,height=700")}"
      ></sc-button>
    </p>


    <section id="clients-container" style="
      display: block;
      width: 1000px;
      height: 800px;
    ">
    </section>
  </div>
`, $container);

const $clientsContainer = document.querySelector('#clients-container');
// create 20 clients in a 4*5 matrix placement
for (let y = 0; y < 4; y++) {
  for (let x = 0; x < 5; x++) {
    const $div = document.createElement('div');
    $div.classList.add('emulate');
    $clientsContainer.appendChild($div);

    // modify y to put clients on a circular line to mimic a concert hall
    let yMod = x / 4 * 2 - 1;
    yMod = yMod ** 2;
    yMod = (1 - yMod) * 2 - 1;
    yMod = yMod * 0.3;

    const position = { x, y: y + yMod };
    launch($div, position);
  }
}

