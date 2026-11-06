import { browser } from '$app/environment';

/** Dispositivo táctil sin ratón (móvil o tableta): El Origen necesita ratón, teclado y ventanas */
class Device {
  touch = $state(false);
  ready = $state(false);

  load() {
    if (!browser || this.ready) return;
    const mq = matchMedia('(hover: none) and (pointer: coarse)');
    this.touch = mq.matches;
    mq.addEventListener('change', (e) => (this.touch = e.matches));
    this.ready = true;
  }
}

export const device = new Device();
