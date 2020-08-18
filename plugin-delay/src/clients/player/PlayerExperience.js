import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

class PlayerExperience extends AbstractExperience {
  constructor(client, config = {}, $container) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;

    // require plugins if needed
    this.delay1 = this.require('delay-1');
    this.delay2 = this.require('delay-2');
    this.delay3 = this.require('delay-3');

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
      render(html`
        <h1 style="padding: 20px; margin: 0">${this.client.type} [id: ${this.client.id}]</h1>
      `, this.$container);
    });
  }
}

export default PlayerExperience;
