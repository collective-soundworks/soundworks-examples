import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

class PlayerExperience extends AbstractExperience {
  constructor(client, config = {}, $container) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;

    this.checkin = this.require('checkin');

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
      const { index, data } = this.checkin.getValues();

      render(html`
        <div style="padding: 20px; background-color: ${data.color}; height: 100%">
          <h1 style="margin: 20px 0">${this.client.type} [id: ${this.client.id}]</h1>
          <h2 style="margin: 10px 0">index: ${index}</h2>
          <h2 style="margin: 10px 0">label: ${data.label}</h2>
        </div>
      `, this.$container);
    });
  }
}

export default PlayerExperience;
