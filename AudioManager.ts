const theme = require("./assets/sound/theme.mp3");

class AudioManager {
  private theme: HTMLMediaElement;
  private context: AudioContext;
  private gain: GainNode;

  constructor() {
    // for legacy browsers
    this.context = new AudioContext();

    this.theme = this.addAudioSrc();
    this.adjustGain();
  }

  private adjustGain() {
    this.gain = this.context.createGain();
    this.gain.gain.value = 0.1;
  }

  private addAudioSrc() {
    const el = document.createElement("audio");
    el.src = theme;
    el.setAttribute("preload", "auto");
    el.setAttribute("controls", "none");
    // this.sound.setAttribute("autoplay", "none");
    el.style.display = "none";
    document.body.appendChild(el);
    return el;
  }

  playCollision() {}

  playTheme() {
    const themeTrack = this.context.createMediaElementSource(this.theme);
    themeTrack.connect(this.gain).connect(this.context.destination);
    this.theme.play();
  }
}

export default AudioManager;
