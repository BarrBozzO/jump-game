import StateManager from "./StateManager";
import DrawManager from "./DrawManager";
import AudioManager from "./AudioManager";
import { GAME_STATUS } from "./constats";

class Game {
  private gameDomEl: HTMLElement;
  private drawer: DrawManager;
  private state: StateManager;
  private audio: AudioManager;

  constructor(domId: string = "") {
    this.gameDomEl = document.getElementById(`${domId}`) as HTMLElement;
    this.drawer = new DrawManager(this.gameDomEl);
    this.state = new StateManager({
      w: this.gameDomEl.offsetWidth,
      h: this.gameDomEl.offsetHeight,
    });
    this.audio = new AudioManager();
  }

  init() {
    const $this = this;
    this.play();

    document.addEventListener("keydown", (e) => {
      if (e.code === "Pause") {
        $this.state.togglePause();
      }

      if (e.code === "Space") {
        $this.handleSpace();
      }
    });
  }

  private handleSpace() {
    const { current } = this.state.get();

    if (current.game.status === GAME_STATUS.OVER) {
      this.state.togglePlayAgain();
      this.drawer.reset();
      return;
    }

    this.state.toggleJump();
  }

  private play() {
    this.state.calculate();
    const currentState = this.state.get();
    this.audio.control(currentState);
    this.drawer.render(currentState);
    requestAnimationFrame(this.play.bind(this));
  }

  destroy() {}
}

const area = new Game("game");
area.init();
