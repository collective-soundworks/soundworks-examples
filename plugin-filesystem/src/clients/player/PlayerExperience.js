import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';
import '@ircam/simple-components/sc-text';
import '@ircam/simple-components/sc-button';
import '@ircam/simple-components/sc-dragndrop';



class PlayerExperience extends AbstractExperience {
  constructor(client, config = {}, $container) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;

    // require plugins if needed
    this.filesystem = this.require('filesystem');

    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();

    this.filesystem.subscribe(() => this.render());

    window.addEventListener('resize', () => this.render());
    this.render();
  }

  upload(files) {
    if (this.uploadDir) {
      this.filesystem.upload(this.uploadDir, files)
    } else {
      this.filesystem.upload(files);
    }
  }

  renderTree(node, root) {
    if (node.type === 'file') {
      return html`
      <li>
        <a href="${node.url}" target="_blank">${node.name}</a>
        <button
          @click="${e => this.filesystem.delete(root, node.name)}"
        >delete</button>
      </li>
    `;
    } else {
      return html`
      <li>
        ${node.name}/
        <ul>
          ${node.children.map(node => this.renderTree(node, root))}
        </ul>
      </li>
    `
    }
  }

  render() {
    // debounce with requestAnimationFrame
    window.cancelAnimationFrame(this.rafId);

    const trees = this.filesystem.getValues();

    this.rafId = window.requestAnimationFrame(() => {
      render(html`
        <div style="padding:20px;">
          <h1 style="margin: 30px 0;">@soundworks/plugin-filesystem [client.id: ${this.client.id}]</h1>
          <sc-text
            value="create, delete and rename files directly on your system file system (or from your editor) and see changes in real-time"
            readonly
            width="500"
            height="50"
          >
          </sc-text>
          ${Object.keys(trees).map(key => {
            const tree = trees[key];
            return html`
              <div style="margin: 30px 0;">
                <p>filesystem - name: "${key}", path: "${tree.path}"</p>
                <ul>
                  ${this.renderTree(tree, key)}
                </ul>
              </div>
            `;
          })}
          </div>

          <select 
            style="
              display: block;
              margin-left: 30px
            "
            @change="${e => this.uploadDir = e.target.value}"
          >
            <option value="">select upload destination</option>
            ${Object.keys(trees).map(key => {
              return html`
                <option value="${key}">${key}</option>
              `
            })}
          </select>
          <sc-dragndrop
            style="margin: 30px"
            format="raw"
            label="drop a file to upload it"
            @change="${e => this.upload(e.detail.value)}"
          >
          </sc-dragndrop>
        </div>
      `, this.$container);
    });
  }
}

export default PlayerExperience;
