import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

class PlayerExperience extends AbstractExperience {
  constructor(client, config = {}, $container, audioContext) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.audioContext = audioContext;
    this.rafId = null;

    // require plugins if needed
    this.platform = this.require('platform');

    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();

    const now = this.audioContext.currentTime;

    for (let i = 0; i < 25; i++) {
      const startTime = now + (i * 0.1);

      const env = this.audioContext.createGain();
      env.connect(this.audioContext.destination);
      env.gain.value = 0;

      const sine = this.audioContext.createOscillator();
      sine.connect(env);
      sine.frequency.value = 200 * (i + 1);

      env.gain.setValueAtTime(0, startTime);
      env.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, startTime + 1);

      sine.start(startTime);
      sine.stop(startTime + 1);
    }

    window.addEventListener('resize', () => this.render());
    this.render();
  }

  render() {
    // debounce with requestAnimationFrame
    window.cancelAnimationFrame(this.rafId);

    this.rafId = window.requestAnimationFrame(() => {
      render(html`
        <h1 style="padding: 20px; margin: 0">${this.client.type} [id: ${this.client.id}]</h1>
      `, this.$container);
    });
  }
}

export default PlayerExperience;
