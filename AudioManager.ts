import { GAME_STATUS } from "./constats";

const theme = require("./assets/sound/theme.mp3");
const death = require("./assets/sound/death.mp3");
const run = require("./assets/sound/running.mp3");

const SOUNDS = {
  death,
  theme,
  run,
};

class AudioManager {
  private theme: HTMLAudioElement;
  private run: HTMLAudioElement;
  private death: HTMLAudioElement;
  private context: AudioContext;
  private gain: GainNode;

  constructor() {
    // for legacy browsers
    this.context = new AudioContext();
    this.gain = this.context.createGain();
    this.gain.gain.value = 0.1;

    this.theme = this.addAudioSrc("theme");
    this.death = this.addAudioSrc("death");
    this.run = this.addAudioSrc("run");
  }

  private addAudioSrc(name: "death" | "run" | "theme") {
    const el = document.createElement("audio");
    el.src = SOUNDS[name];
    el.setAttribute("preload", "auto");
    el.setAttribute("controls", "none");
    // this.sound.setAttribute("autoplay", "none");
    el.style.display = "none";
    document.body.appendChild(el);

    const track = this.context.createMediaElementSource(el);
    track.connect(this.gain).connect(this.context.destination);

    return el;
  }

  public control({ current: currentState, prev: prevState }) {
    if (
      currentState.game.status === GAME_STATUS.PLAY &&
      currentState.world.x === 10
    ) {
      this.playTheme();
    }

    if (
      currentState.game.status === GAME_STATUS.OVER &&
      currentState.game.status !== prevState.game.status
    ) {
      this.stopTheme();
      this.playDeath();
    }
  }

  private playDeath() {
    this.death.play();
  }

  private playTheme() {
    this.theme.play();
  }

  private playRun() {
    this.run.play();
  }

  private stopTheme() {
    this.theme.pause();
  }
}

export default AudioManager;
