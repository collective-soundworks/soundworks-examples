import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import '@ircam/simple-components/sc-editor.js';
import '@ircam/simple-components/sc-text.js';
import '@ircam/simple-components/sc-button.js';
import { ifDefined } from 'lit-html/directives/if-defined';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

class PlayerExperience extends AbstractExperience {
  constructor(client, config = {}, $container) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;
    this.currentScript = undefined;

    this.scripting = this.require('scripting');

    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();

    this.globals = await this.client.stateManager.attach('globals');

    this.globals.subscribe(async updates => {
      if ('currentScript' in updates) {
        if (updates.currentScript === null) {
          if (this.currentScript) {
            await this.currentScript.detach();
            this.render();
          }
        } else {
          this.updateCurrentScript(updates.currentScript);
        }
      }
    });

    // track script list updates
    this.scripting.subscribe(() => this.render());

    window.addEventListener('resize', () => this.render());
    this.render();

    this.$canvas = document.querySelector('canvas');
    this.ctx = this.$canvas.getContext('2d');

    if (this.globals.get('currentScript') !== null) {
      this.updateCurrentScript(this.globals.get('currentScript'));
    }
  }

  selectScript(scriptName) {
    // we set the script using the globals state to propagate to all connected clients
    this.globals.set({ currentScript: scriptName });
  }

  async createScript(scriptName) {
    if (scriptName !== '') {
      const defaultValue = `// script ${scriptName}
function draw(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);

  // do stuff...
}`
      // create the script, it will be available to all node
      await this.scripting.create(scriptName, defaultValue);
      this.selectScript(scriptName);
    }
  }

  async deleteScript(scriptName) {
    await this.scripting.delete(scriptName);

    if (this.globals.get('currentScript') === scriptName) {
      this.globals.set({ currentScript: null });
    }

    this.render();
  }

  async updateCurrentScript(scriptName) {
    if (this.currentScript) {
      await this.currentScript.detach();
    }

    this.currentScript = await this.scripting.attach(scriptName);

    // arguments of the script
    const ctx = this.ctx;
    const width = this.$canvas.width;
    const height = this.$canvas.height;

    // subscribe to update and re-execete the script
    this.currentScript.subscribe(() => {
      this.currentScript.execute(ctx, width, height);
      this.render();
    });

    this.currentScript.onDetach(() => {
      // clean screen
      this.currentScript = undefined;
      this.ctx.clearRect(0, 0, width, height)
      this.render();
    });

    this.currentScript.execute(ctx, width, height);
    this.render();
  }

  setScriptValue(value) {
    if (this.currentScript) {
      this.currentScript.setValue(value);
    }
  }

  render() {
    render(html`
      <div style="padding: 10px">
        <h1 style="padding: 0; margin: 20px 0px">plugin scripting [id: ${this.client.id}]</h1>

        <section style="margin: 8px 0">
          <sc-text
            value="create script (cmd + s):"
            readonly
          ></sc-text>
          <sc-text
            @change="${e => this.createScript(e.detail.value)}"
          ></sc-text>
        </section>

        ${this.scripting.getList().map((scriptName) => {
          return html`
            <section style="margin: 4px 0">
              <sc-button
                value="${scriptName}"
                text="select ${scriptName}"
                @input="${() => this.selectScript(scriptName)}"
              ></sc-button>
              <sc-button
                value="${scriptName}"
                text="delete ${scriptName}"
                @input="${() => this.deleteScript(scriptName)}"
              ></sc-button>
            </section>
          `;
        })}

        <sc-editor
          style="display:block"
          width="500"
          height="300"
          .value="${(this.currentScript && this.currentScript.getValue() || '')}"
          @change="${e => this.setScriptValue(e.detail.value)}"
        ></sc-editor>

        <canvas style="display:block" width="500" height="500"></canvas>
      </div>
    `, this.$container);
  }
}

export default PlayerExperience;
