import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

class ControllerExperience extends AbstractExperience {
  constructor(client, config, $container) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;

    // require plugins if needed

    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();

    this.playerStates = new Map();

    console.log('> check OBSERVE_REQUEST');
    this.client.stateManager.observe(async (schemaName, stateId, nodeId) => {
      if (schemaName === 'player') {
        const state = await this.client.stateManager.attach(schemaName, stateId);
        console.log('attached playerState', nodeId);

        state.onDetach(() => {
          console.log('detached playerState', nodeId);
          this.playerStates.delete(nodeId);
          this.render();
        });

        state.subscribe(() => this.render());

        this.playerStates.set(nodeId, state);

        this.render();
      }
    });

    // observe twice
    console.log(`> make sure we don't receive the list twice when subscribing two observe callbacks`);
    this.client.stateManager.observe((schemaName, stateId, nodeId) => {
      console.log(schemaName, stateId, nodeId);
    });

    this.globalState = await this.client.stateManager.attach('global');
    this.globalState.subscribe((updates) => this.render());

    window.addEventListener('resize', () => this.render());
    this.render();
  }

  render() {
    // debounce with requestAnimationFrame
    window.cancelAnimationFrame(this.rafId);

    this.rafId = window.requestAnimationFrame(() => {
      const players = Array.from(this.playerStates.values());

      render(html`
        <p>
          global.float:
          <input type="range"
            min="0"
            max="1"
            step="0.001"
            .value="${this.globalState.get('float')}"
            @input="${e => this.globalState.set({ float: parseFloat(e.target.value) })}"
          />
        </p>
        <pre><code>
globals:
${JSON.stringify(this.globalState.getValues(), null, 2)}

players:
${players.map(state => JSON.stringify(state.getValues(), null, 2)).join('\n')}
        </code><pre>
      `, this.$container);
    });
  }
}

export default ControllerExperience;
