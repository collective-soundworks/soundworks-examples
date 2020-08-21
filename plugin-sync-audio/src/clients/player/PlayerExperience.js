import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';
import '@ircam/simple-components/sc-text.js';
import '@ircam/simple-components/sc-bang.js';
import '@ircam/simple-components/sc-number.js';
import '@ircam/simple-components/sc-toggle.js';
import { Scheduler } from 'waves-masters';

class PlayerExperience extends AbstractExperience {
  constructor(client, config = {}, $container, audioContext) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;
    this.audioContext = audioContext;

    this.platform = this.require('platform');
    this.sync = this.require('sync');

    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();

    // globals state to shared information between all clients
    this.globals = await this.client.stateManager.attach('globals');

    // Create a scheduler that schedule events in the sync time reference
    const getTimeFunction = () => this.sync.getSyncTime();
    // Provide a conversion function that allows the scheduler to compute
    // the audio time from it own scheduling time reference.
    // As `currentTime` is in the sync time reference we gave in
    // `getTimeFunction` and that the sync plugin is configured to use
    // the audio clock as a local reference, we therefore just need to convert
    // back to the local time.
    const currentTimeToAudioTimeFunction =
      currentTime => this.sync.getLocalTime(currentTime);

    this.scheduler = new Scheduler(getTimeFunction, {
      currentTimeToAudioTimeFunction
    });

    // define simple engines for the scheduler
    this.metroAudio = {
      // `currentTime` is the current time of the scheduler (aka the syncTime)
      // `audioTime` is the audioTime as computed by `currentTimeToAudioTimeFunction`
      // `dt` is the time between the actual call of the function and the time of the
      // scheduled event
      advanceTime: (currentTime, audioTime, dt) => {
        const env = this.audioContext.createGain();
        env.connect(this.audioContext.destination);
        env.gain.value = 0;

        const sine = this.audioContext.createOscillator();
        sine.connect(env);
        sine.frequency.value = 200 * (this.client.id % 10 + 1);

        env.gain.setValueAtTime(0, audioTime);
        env.gain.linearRampToValueAtTime(1, audioTime + 0.01);
        env.gain.exponentialRampToValueAtTime(0.0001, audioTime + 0.1);

        sine.start(audioTime);
        sine.stop(audioTime + 0.1);

        return currentTime + 1;
      }
    }

    this.metroVisual = {
      advanceTime: (currentTime, audioTime, dt) => {
        if (!this.$beat) {
          this.$beat = document.querySelector(`#beat-${this.client.id}`);
        }

        // console.log(`go in ${dt * 1000}`)
        // this.$beat.active = true;
        setTimeout(() => this.$beat.active = true, Math.round(dt * 1000));

        return currentTime + 1;
      }
    };


    this.globals.subscribe(updates => {
      this.updateEngines();
      this.render();
    });
    this.updateEngines();

    window.addEventListener('resize', () => this.render());

    this.render();
  }

  updateEngines() {
    if (this.globals.get('enabled')) {
      const nextTime = Math.ceil(this.sync.getSyncTime());
      this.scheduler.add(this.metroAudio, nextTime);
      this.scheduler.add(this.metroVisual, nextTime);
    } else {
      if (this.scheduler.has(this.metroAudio) && this.scheduler.has(this.metroVisual)) {
        this.scheduler.remove(this.metroAudio);
        this.scheduler.remove(this.metroVisual);
      }
    }
  }

  render() {
    render(html`
      <div style="padding: 10px">
      <h1 style="padding: 0px; margin: 20px 0">
        @soundworks/plugin-sync [client.id: ${this.client.id}]
      </h1>

      <div style="margin:4px 0;">
        <sc-text
          value="start metro"
          readonly
        ></sc-text>
        <sc-toggle
          ?active="${this.globals.get('enabled')}"
          @change="${e => this.globals.set({ enabled: e.detail.value})}"
          readonly
        ></sc-toggle>
        <sc-bang id="beat-${this.client.id}"></sc-bang>
      </div>
      </div>
    `, this.$container);
  }
}

export default PlayerExperience;
