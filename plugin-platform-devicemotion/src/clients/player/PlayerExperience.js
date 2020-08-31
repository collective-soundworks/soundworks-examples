import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';
import '@ircam/simple-components/sc-signal.js'

class PlayerExperience extends AbstractExperience {
  constructor(client, config = {}, $container, devicemotion) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.devicemotion = devicemotion;
    this.rafId = null;

    // require plugins if needed
    this.platform = this.require('platform');

    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();

    this.devicemotion.addEventListener(e => {
      // quick and dirty, the element should be cached...
      const $plot = document.querySelector('#plot');

      $plot.value = {
        time: Date.now() / 1000,
        data: [
          e.accelerationIncludingGravity.x / 9.81,
          e.accelerationIncludingGravity.y / 9.81,
          e.accelerationIncludingGravity.z / 9.81,
          e.rotationRate.alpha / 360,
          e.rotationRate.beta / 360,
          e.rotationRate.gamma / 360,
        ]
      }
    });

    window.addEventListener('resize', () => this.render());
    this.render();
  }

  render() {
    // debounce with requestAnimationFrame
    window.cancelAnimationFrame(this.rafId);

    this.rafId = window.requestAnimationFrame(() => {
      render(html`
        <h1 style="padding: 20px; margin: 0">@soundworks/plugin-platform [id: ${this.client.id}]</h1>
        <sc-signal style="margin: 20px;" id="plot"></sc-signal>
      `, this.$container);
    });
  }
}

export default PlayerExperience;
