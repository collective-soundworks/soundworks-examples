import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

class PlayerExperience extends AbstractExperience {
  constructor(client, config = {}, $container) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;

    this.filesystem = this.require('filesystem');
    this.audioBufferLoader = this.require('audio-buffer-loader');

    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();

    // subscribe to display loading state
    this.audioBufferLoader.subscribe(() => this.render());
    // subscribe to display loading state
    this.filesystem.subscribe(() => this.loadSoundbank());

    // init with current content
    this.loadSoundbank();

    window.addEventListener('resize', () => this.render());
    this.render();
  }

  loadSoundbank() {
    const soundbankTree = this.filesystem.get('soundbank');
    const defObj = {};

    soundbankTree.children.forEach(leaf => {
      if (leaf.type === 'file') {
        defObj[leaf.name] = leaf.url;
      }
    });

    this.audioBufferLoader.load(defObj, true);
  }

  render() {
    // debounce with requestAnimationFrame
    window.cancelAnimationFrame(this.rafId);

    this.rafId = window.requestAnimationFrame(() => {
      const loading = this.audioBufferLoader.get('loading');
      const data = this.audioBufferLoader.data;

      render(html`
        <div style="padding: 20px">
          <h1 style="margin: 20px 0">@soundworks/plugin-audio-buffer-loader [id: ${this.client.id}]</h1>

          <p>${loading ? 'loading...' : 'loaded'}<p>
          <p>add or remove .wav or .mp3 files in the "soundbank" directory and observe the changes:</p>

          ${Object.keys(data).map(key => {
            return html`<p>- "${key}" loaded: ${data[key]}.</p>`;
          })}
        </div>
      `, this.$container);
    });
  }
}

export default PlayerExperience;
