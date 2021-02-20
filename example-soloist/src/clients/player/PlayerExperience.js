import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';
import '@ircam/simple-components/sc-dot-map.js';

class PlayerExperience extends AbstractExperience {
  constructor(client, config = {}, $container, position, showPositionScreen) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;

    this.position = this.require('position');

    if (showPositionScreen)
       renderInitializationScreens(client, config, $container);
     else 
       this.position.setPosition(position.x, position.y);
  }

  async start() {
    super.start();

    const id = this.client.id;
    const position = this.position.getPosition();

    this.state = await this.client.stateManager.create('player', { position, id, distance: 1 });
    this.state.subscribe(updates => this.render());

    window.addEventListener('resize', () => this.render());
    this.render();
  }

  render() {
    // debounce with requestAnimationFrame
    const rect = this.$container.getBoundingClientRect();

    window.cancelAnimationFrame(this.rafId);

    this.rafId = window.requestAnimationFrame(() => {
      render(html`
        <sc-dot-map
          x-range="${JSON.stringify(this.position.options.xRange)}"
          y-range="${JSON.stringify(this.position.options.yRange)}"
          width="${rect.width}"
          height="${rect.height}"
          value="[${JSON.stringify(this.position.getPosition())}]"
          color="#ffffff"
          style="outline: 1px solid #aaaaaa;"
        ></sc-dot-map>
        <div
          style="
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #ffffff;
            opacity: ${1 - this.state.get('distance')};
          "
        ></div>
        <div class="player-id">[id: ${this.client.id}]</div>
      `, this.$container);
    });
  }
}

export default PlayerExperience;
