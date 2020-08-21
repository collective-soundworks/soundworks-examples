import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';
import '@ircam/simple-components/sc-text';

class PlayerExperience extends AbstractExperience {
  constructor(client, config = {}, $container) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;

    this.sync = this.require('sync');

    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();

    window.addEventListener('resize', () => this.render());

    const updateClock = () => {
      this.render();
      window.requestAnimationFrame(updateClock);
    }

    window.requestAnimationFrame(updateClock);
  }

  render() {
    const localTime = this.sync.getLocalTime().toFixed(3);
    const syncTime = this.sync.getSyncTime().toFixed(3);
    const report = JSON.stringify(this.sync.getReport(), null, 2);

    render(html`
      <div style="padding: 10px">
      <h1 style="padding: 0px; margin: 10px 0">
        @soundworks/plugin-sync [client.id: ${this.client.id}]
      </h1>

      <div style="margin:4px 0;">
        <sc-text
          value="local time"
          readonly
        ></sc-text>
        <sc-text
          value="${localTime}"
          readonly
        ></sc-text>
      </div>
      <div style="margin:4px 0;">
        <sc-text
          value="sync time"
          readonly
        ></sc-text>
        <sc-text
          value="${syncTime}"
          readonly
        ></sc-text>
      </div>
      <div style="margin:4px 0;">
        <sc-text
          value="report"
          readonly
        ></sc-text>
        <sc-text
          value="${report}"
          width="400"
          height="250"
          readonly
        ></sc-text>
      </div>
    `, this.$container);
  }
}

export default PlayerExperience;
