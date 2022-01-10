import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

import { Scheduler } from 'waves-masters';

import '@ircam/simple-components/sc-text.js';
import '@ircam/simple-components/sc-toggle.js';

class PlayerExperience extends AbstractExperience {
  constructor(client, config, $container, audioContext) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.audioContext = audioContext;
    this.rafId = null;

    this.platform = this.require('platform');
    this.audioStreams = this.require('audio-streams');
    this.sync = this.require('sync');

    this.streamSources = new Map();
    this.syncedStreamSources = new Map();

    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();

    this.globals = await this.client.stateManager.attach('globals');
    this.globals.subscribe(updates => {
      const { streamId, flag, syncTime } = updates.toggleStream;
      this.toggleSyncedStream(streamId, flag, syncTime);
    });

    // this.syncedScheduler = new Scheduler(() => this.sync.getSyncTime(), {
    //   currentTimeToAudioTimeFunction: currentTime => this.sync.getLocalTime(currentTime),
    // });

    // this._frequencyRatio = 1;
    // this.sync.onReport(report => {
    //   this._frequencyRatio = report.frequencyRatio;
    //   console.log('sync', report.status, report.frequencyRatio);

    //   for (let [name, src] of this.syncedStreamSources.entries()) {
    //     console.log(name, src);
    //     src._playbackRate = report.frequencyRatio;
    //   }
    // });

    // const streamIds = this.audioStreams.get('list');
    // const src = this.audioStreams.createStreamSource();
    // src.streamId = streamIds[0];
    // src.connect(this.audioContext.destination);

    // const now = this.audioContext.currentTime;
    // src.start(now, 10);
    // src.stop(now + 4);


    // const streamIds = this.audioStreams.get('list');
    // const src = this.audioStreams.createStreamSource();
    // src.scheduler = this.syncedScheduler;
    // src.streamId = streamIds[0];
    // src.connect(this.audioContext.destination);

    // const now = this.sync.getSyncTime();
    // // const now = this.audioContext.currentTime;
    // src.start(now, 10);
    // // src.stop(now + 4);

    // setTimeout(() => {
    //   const now = this.audioContext.currentTime;
    //   src.stop(now + 4);
    // }, 4000);

    window.addEventListener('resize', () => this.render());
    this.render();
  }

  toggleStream(streamId, flag) {
    if (flag) {
      const src = this.audioStreams.createStreamSource();
      src.streamId = streamId;
      src.connect(this.audioContext.destination);

      this.streamSources.set(streamId, src);
      src.addEventListener('ended', () => this.streamSources.delete(streamId));

      src.start();
    } else {
      const src = this.streamSources.get(streamId);
      this.streamSources.delete(streamId);

      src.stop();
    }

    this.render();
  }

  toggleSyncedStream(streamId, flag, syncTime) {
    if (flag) {
      const src = this.audioStreams.createStreamSource(this.syncedScheduler);
      src.streamId = streamId;
      src.connect(this.audioContext.destination);

      this.syncedStreamSources.set(streamId, src);
      src.addEventListener('ended', () => this.syncedStreamSources.delete(streamId));

      src.start(syncTime);
    } else {
      const src = this.syncedStreamSources.get(streamId);
      this.syncedStreamSources.delete(streamId);

      src.stop(syncTime);
    }

    this.render();
  }

  render() {
    const streamIds = this.audioStreams.get('list');

    render(html`
      <div style="padding: 20px">
        <h1 style="margin: 20px 0">${this.client.type} [id: ${this.client.id}]</h1>

        ${streamIds.map(streamId => {
          return html`
            <div style="padding-bottom: 4px">
              <sc-text
                readonly
                value="${streamId}"
              ></sc-text>
              <sc-toggle
                @change="${e => this.toggleStream(streamId, e.detail.value)}"
                .value="${this.streamSources.has(streamId)}"
              ></sc-toggle>
              <sc-text
                readonly
                width="80"
                value="synced"
              ></sc-text>
              <sc-toggle
                @change="${e => {
                  this.globals.set({
                    toggleStream: { streamId, flag: e.detail.value }
                  });
                }}"
                .value="${this.syncedStreamSources.has(streamId)}"
              ></sc-toggle>
            </div>
          `;
        })}
      </div>
    `, this.$container);
  }
}

export default PlayerExperience;
