import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

class PlayerExperience extends AbstractExperience {
  constructor(client, config = {}, $container) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;

    this.text = [];
    this.logger = this.require('logger');

    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();

    this.log(`-----------------------------------------------`);
    // regular writer
    // ------------------------------------------------------

    // > create a writer
    // the filename will be automatically prefix with the date and time,
    // following the format: `yyyymmdd-hhmmss-${filename}
    const filename = `client-${this.client.id}-log-file.csv`;
    this.log(`> creating writer ${filename}`);
    const writer = await this.logger.create(filename);
    // > writing data into file,
    // create arbitrary data, the formatting of the data is left to the user
    for (let i = 0; i < 10; i++) {
      let line = '';
      for (let j = 0; j < 5; j++) {
        line += `${i + j};`
      }

      writer.write(line); // be aware that these operations are asynchronous
      this.log(`- writing line ${i+1}: ${line}`);
    }

    // > closing writer
    this.log(`> closing writer ${filename}`);
    writer.close(); // be aware that these operations are asynchronous


    this.log(`-----------------------------------------------`);
    // shared writer
    // ------------------------------------------------------

    // > attach to a writer created by the server
    this.log(`> attaching to shared writer ${filename}`);
    const sharedWriter = await this.logger.attach('shared-writer');

    // > write things into it
    this.log(`- writing: "client ${this.client.id} wrote something"`);
    sharedWriter.write(`client ${this.client.id} wrote something`);

    // later... close connection, the writer stays open for other
    // connections until it's closed by the server
    this.log(`> closing connection to shared writer ${filename}`);
    sharedWriter.close();


    this.log(`-----------------------------------------------`);
    // buffering writer
    // ------------------------------------------------------

    const bufferFilename = `client-${this.client.id}-buffering`;
    this.log(`> creating buffering writer ${bufferFilename}`);
    const bufferingWriter = await this.logger.create(bufferFilename, {
      bufferSize: 20,
    });

    this.log(`- send some data in binary format`);

    let line = 0;

    const intervalId = setInterval(() => {
      for (let i = 0; i < 25; i++) {
        line += 1;

        const data = new Uint8Array(2);
        data[0] = line;
        data[1] = i;

        bufferingWriter.write(data);

        if (line === 123) {
          clearInterval(intervalId);
          this.log(`> closing ${bufferFilename} (the file should contain 123 lines)`);
          bufferingWriter.close();
        }
      }
    }, 1000);

    window.addEventListener('resize', () => this.render());
    this.render();
  }

  log(msg) {
    this.text.push(msg);
    this.render();
  }

  render() {
    // debounce with requestAnimationFrame
    window.cancelAnimationFrame(this.rafId);

    this.rafId = window.requestAnimationFrame(() => {
      render(html`
        <h1 style="padding: 20px; margin: 0">${this.client.type} [id: ${this.client.id}]</h1>
        <div style="margin: 20px">
          ${this.text.map(msg => {
            return html`<p>${msg}</p>`;
          })}
        </div>
      `, this.$container);
    });
  }
}

export default PlayerExperience;
