import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';
import '@ircam/simple-components/sc-text.js'

class PlayerExperience extends AbstractExperience {
  constructor(client, config = {}, $container) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;

    this.position = this.require('position');

    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();

    window.addEventListener('resize', () => this.render());
    this.render();
  }

  render() {
    // debounce with requestAnimationFrame
    window.cancelAnimationFrame(this.rafId);

    this.rafId = window.requestAnimationFrame(() => {
      const position = this.position.getPosition();

      render(html`
        <div style="padding: 20px">
          <h1 style="margin: 20px 0">${this.client.type} [id: ${this.client.id}]</h1>
          <sc-text
            style="margin: 4px"
            value="position"
            readonly
          ></sc-text>
          <sc-text
            style="margin: 4px"
            width="300"
            height="80"
            value="${JSON.stringify(position, null, 2)}"
            readonly
          ></sc-text>
        </div>
      `, this.$container);
    });
  }
}

export default PlayerExperience;
