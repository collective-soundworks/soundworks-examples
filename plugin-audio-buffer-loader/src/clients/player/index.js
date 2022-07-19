import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { Client } from '@soundworks/core/client';
import initQoS from '@soundworks/template-helpers/client/init-qos.js';

import pluginAudioBufferLoaderFactory from '@soundworks/plugin-audio-buffer-loader/client';

import PlayerExperience from './PlayerExperience.js';

const config = window.soundworksConfig;
// store experiences of emulated clients
const experiences = new Set();


async function launch($container, index) {
  try {
    const client = new Client();

    // -------------------------------------------------------------------
    // register plugins
    // -------------------------------------------------------------------
    client.pluginManager.register('audio-buffer-loader', pluginAudioBufferLoaderFactory, {
      data: {
        '88-fingers-short.mp3': 'sounds/88-fingers-short.mp3',
        'drops-short.mp3': 'sounds/drops-short.mp3',
        'plane-short.mp3': 'sounds/plane-short.mp3',
        // 'piano.ogg': 'sounds/piano.ogg',
        'infos': 'sounds/infos.json',
      },
      // by default, supported exntesions are very restrictive to support all
      // browsers, i.e. /\.(wav|mp3|json)$/i
      // be aware that some browsers might not support some format, e.g. safari
      // does ont support oog files.
      // uncomment the line below and the ogg file to test.
      // supportedExtensionRegExp: /\.(wav|mp3|ogg|json)$/i,
    }, []);

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
const searchParams = new URLSearchParams(window.location.search);
// enable instanciation of multiple clients in the same page to facilitate
// development and testing (be careful in production...)
const numEmulatedClients = parseInt(searchParams.get('emulate')) || 1;

// special logic for emulated clients (1 click to rule them all)
if (numEmulatedClients > 1) {
  for (let i = 0; i < numEmulatedClients; i++) {
    const $div = document.createElement('div');
    $div.classList.add('emulate');
    $container.appendChild($div);

    launch($div, i);
  }

  const $initPlatformBtn = document.createElement('div');
  $initPlatformBtn.classList.add('init-platform');
  $initPlatformBtn.textContent = 'resume all';

  function initPlatforms(e) {
    experiences.forEach(experience => {
      if (experience.platform) {
        experience.platform.onUserGesture(e)
      }
    });
    $initPlatformBtn.removeEventListener('touchend', initPlatforms);
    $initPlatformBtn.removeEventListener('mouseup', initPlatforms);
    $initPlatformBtn.remove();
  }

  $initPlatformBtn.addEventListener('touchend', initPlatforms);
  $initPlatformBtn.addEventListener('mouseup', initPlatforms);

  $container.appendChild($initPlatformBtn);
} else {
  launch($container, 0);
}
