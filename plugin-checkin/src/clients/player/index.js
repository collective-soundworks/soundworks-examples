import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { render, html } from 'lit-html';
import { Client } from '@soundworks/core/client';
import initQoS from '@soundworks/template-helpers/client/init-qos.js';

import pluginCheckinFactory from '@soundworks/plugin-checkin/client';

import PlayerExperience from './PlayerExperience.js';

const config = window.soundworksConfig;
// store experiences of emulated clients
const experiences = new Set();


async function launch($container) {
  try {
    const client = new Client();

    // -------------------------------------------------------------------
    // register plugins
    // -------------------------------------------------------------------
    client.pluginManager.register('checkin', pluginCheckinFactory, {}, []);

    // -------------------------------------------------------------------
    // launch application
    // -------------------------------------------------------------------
    await client.init(config);
    initQoS(client);

    const experience = new PlayerExperience(client, config, $container);
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
    <h1>@soundworks/plugin-checkin</h1>
    <p>
      This page instanciated 5 clients, one of them should display an error message.
    </p>
    <p>
      If you reload the page, you will see the ids increase while the indexes will stay the same.
    </p>



    <section id="clients-container" style="
      display: block;
      width: 1250px;
      height: 400px;
    ">
    </section>
  </div>
`, $container);

const $clientsContainer = document.querySelector('#clients-container');
// create 20 clients in a 4*5 matrix placement
for (let x = 0; x < 5; x++) {
  const $div = document.createElement('div');
  $div.style.width = `250px`;
  $div.style.height = `400px`;
  $div.classList.add('emulate');
  $clientsContainer.appendChild($div);

  launch($div);
}
