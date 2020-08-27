import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';
import '@ircam/simple-components/sc-dot-map.js';
import '@ircam/simple-components/sc-text.js';
import '@ircam/simple-components/sc-toggle.js';
import '@ircam/simple-components/sc-slider.js';

class ControllerExperience extends AbstractExperience {
  constructor(client, config, $container) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;

    this.players = new Set();

    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();

    this.state = await this.client.stateManager.attach('controller');
    this.state.subscribe(() => this.render());

    this.client.stateManager.observe(async (schemaName, stateId, nodeId) => {
      if (schemaName === 'player') {
        const playerState = await this.client.stateManager.attach(schemaName, stateId);

        this.players.add(playerState);
        playerState.onDetach(() => this.players.delete(playerState));

        this.render();
      }
    });

    window.addEventListener('resize', () => this.render());
    this.render();
  }

  render() {
    // debounce with requestAnimationFrame
    window.cancelAnimationFrame(this.rafId);

    this.rafId = window.requestAnimationFrame(() => {
      let { xRange, yRange, rotateMap, radius, pointers } = this.state.getValues();
      const { radius: radiusInfos } = this.state.getSchema();
      // consol.leo
      if (rotateMap) {
        // to rotate the map, we just need to flip the coordinate system
        // of the maps
        // @note - we need to copy the array to prevent state polution
        xRange = xRange.slice(0).reverse();
        yRange = yRange.slice(0).reverse();
      }

      const playerPositions = Array.from(this.players).map(playerState => playerState.get('position'));
      // console.log(xRange, yRange);

      render(html`
        <div style="padding: 20px;">
          <h1 style="margin: 20px 0;">${this.client.type} [id: ${this.client.id}]</h1>
          <p>
            <sc-text
              readonly
              value="radius"
            ></sc-text>
            <sc-slider
              min="${radiusInfos.min}"
              max="${radiusInfos.max}"
              value="${radius}"
              @input="${e => this.state.set({ radius: e.detail.value })}"
            ></sc-slider>
          </p>
          <p>
            <sc-text
              readonly
              height="60"
              value="if you are in front of the audience you might want to rotate the map"
            ></sc-text>
            <sc-toggle
              ?active="${rotateMap}"
              @change="${e => this.state.set({ rotateMap: e.detail.value })}"
            ></sc-toggle>
          </p>
          <div
            style="
              width: 500px;
              height: 500px;
              position: relative;
            "
          >
            <!-- display map of players -->
            <sc-dot-map
              style="
                position: absolute;
                top: 0;
                left: 0;
                z-index: 0;
              "
              width="500"
              height="500"
              color="white"
              x-range="${JSON.stringify(xRange)}"
              y-range="${JSON.stringify(yRange)}"
              value="${JSON.stringify(playerPositions)}"
            ></sc-dot-map>
             <!-- display pointer feedback -->
            <sc-dot-map
              style="
                position: absolute;
                top: 0;
                left: 0;
                z-index: 1;
              "
              width="500"
              height="500"
              x-range="${JSON.stringify(xRange)}"
              y-range="${JSON.stringify(yRange)}"
              value="${JSON.stringify(pointers)}"
              radius-rel="${radius}"
              color="#AA3456"
              opacity="0.2"
              background-opacity="0"
            ></sc-dot-map>
             <!-- display map of players -->
            <sc-dot-map
              style="
                position: absolute;
                top: 0;
                left: 0;
                z-index: 2;
              "
              width="500"
              height="500"
              x-range="${JSON.stringify(xRange)}"
              y-range="${JSON.stringify(yRange)}"
              radius-rel="${radius}"
              color="#AA3456"
              opacity="0.2"
              background-opacity="0"
              capture-events
              @input="${e => this.state.set({ pointers: e.detail.value })}"
            ></sc-dot-map>
          </div>

        </div>
      `, this.$container);
    });
  }
}

export default ControllerExperience;
