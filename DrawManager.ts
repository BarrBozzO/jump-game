import {
  GAME_STATUS,
  PLAYER_CONFIG,
  BARRIER_SIZE,
  GROUND_SIZE,
} from "./constats";
import { StateType, GAME_STATUS_VALUE } from "./StateManager";

type LayerType = {
  id: string;
  dom: HTMLCanvasElement;
};

export default class Drawer {
  private gameDomEl: HTMLElement;
  private layers: {
    [key: string]: LayerType;
  } = {};
  private assets: HTMLElement[] = [];
  private layersOrder: string[] = [];

  static COLORS = {
    ground: "#0F1326",
    sky: "blue",
    cloud: "#fff",
    player: "#ff33ee",
  };

  constructor(domElement: HTMLElement) {
    this.gameDomEl = domElement;

    [
      "backdrop",
      "clouds",
      "ground",
      "score",
      "barriers",
      "player",
      "message",
    ].forEach((layerId) => {
      this.createLayer(layerId);
    });

    this.addAssets();
    this.drawBackdrop();
  }

  public reset() {
    ["clouds", "score", "barriers", "player", "message"].forEach((layerId) => {
      const ctx = this.getLayerContext(layerId);
      ctx.clearRect(0, 0, this.dimensions.w, this.dimensions.h);
    });
  }

  private addImageAsset(container: HTMLElement, path: string, id: string) {
    // backdrop sky
    const img = document.createElement("img");
    img.setAttribute("src", path);
    img.setAttribute("id", id);
    this.assets.push(img);
    container.append(img);
  }

  private addAssets() {
    const div = document.createElement("div");
    div.style["position"] = "absolute";
    div.style["left"] = "-9999px";
    div.style["top"] = "-9999px";

    // backdrop
    this.addImageAsset(div, require("./assets/backdrop/sky.png"), "sky");
    this.addImageAsset(div, require("./assets/backdrop/rocks.png"), "rocks");
    this.addImageAsset(
      div,
      require("./assets/backdrop/ground_1.png"),
      "ground_1"
    );
    this.addImageAsset(
      div,
      require("./assets/backdrop/ground_2.png"),
      "ground_2"
    );
    this.addImageAsset(
      div,
      require("./assets/backdrop/ground_3.png"),
      "ground_3"
    );

    // clouds
    this.addImageAsset(
      div,
      require("./assets/backdrop/clouds_1.png"),
      "cloud_1"
    );
    this.addImageAsset(
      div,
      require("./assets/backdrop/clouds_2.png"),
      "cloud_2"
    );

    // barrier
    this.addImageAsset(div, require("./assets/barrier/monster.png"), "monster");

    // player
    let frames = require(`./assets/player/move/*.png`);
    Object.values(frames).forEach((frame, index) => {
      this.addImageAsset(div, frame as string, "player-move-" + index);
    });
    frames = require(`./assets/player/jump/*.png`);
    Object.values(frames).forEach((frame, index) => {
      this.addImageAsset(div, frame as string, "player-jump-" + index);
    });

    document.body.append(div);
  }

  private createLayer(id: string) {
    const newCanvas = document.createElement("canvas");
    newCanvas.width = this.dimensions.w;
    newCanvas.height = this.dimensions.h;
    newCanvas.setAttribute("id", id);

    newCanvas.style["position"] = "absolute";
    newCanvas.style["top"] = "0";
    newCanvas.style["left"] = "0";

    this.layers[id] = {
      id: id,
      dom: newCanvas,
    };
    this.layersOrder.push(id);
    this.gameDomEl.append(newCanvas);
  }

  getLayerContext(id: string) {
    return this.layers[id].dom.getContext("2d");
  }

  get dimensions() {
    return { w: this.gameDomEl.offsetWidth, h: this.gameDomEl.offsetHeight };
  }

  render({ current: currentState, prev: prevState }) {
    this.drawClouds(currentState, prevState);
    this.drawGround(currentState, prevState);
    this.drawPlayer(currentState, prevState);
    this.drawBarriers(currentState, prevState);
    this.drawScore(currentState.score, currentState.game.status);
    this.drawMessage(currentState, prevState);
  }

  private drawScore(score: number, gameStatus: GAME_STATUS_VALUE) {
    if (gameStatus === GAME_STATUS.PAUSE) {
      return;
    }

    const ctx = this.getLayerContext("score");
    ctx.clearRect(0, 0, this.dimensions.w, 32);

    if (gameStatus === GAME_STATUS.OVER) {
      return;
    }

    ctx.font = "18px sans-serif";
    ctx.strokeStyle = " #2e2e2e";
    ctx.lineWidth = 2;
    const text = "score: " + score;
    ctx.strokeText(
      text,
      this.dimensions.w - 80 - score.toString().length * 10,
      30
    );
    ctx.fillStyle = "#ffffff";
    ctx.fillText(
      text,
      this.dimensions.w - 80 - score.toString().length * 10,
      30
    );
  }

  private drawMessage(state: StateType, prev: StateType) {
    const ctx = this.getLayerContext("message");

    const { w, h } = this.dimensions;

    ctx.clearRect(0, 0, w, h);

    if (state.game.status === GAME_STATUS.OVER) {
      ctx.font = "24px sans-serif";
      const message = "GAME OVER";
      const textMes = ctx.measureText(message);
      ctx.fillText(message, w / 2 - textMes.width / 2, h / 2);

      ctx.font = "14px sans-serif";
      const messageScore = `YOUR SCORE IS ${state.score}`;
      const textMesScore = ctx.measureText(messageScore);
      ctx.fillText(messageScore, w / 2 - textMesScore.width / 2, h / 2 + 24);

      ctx.font = "14px sans-serif";
      const messageSpace = `Press SPACE to play again`;
      const textMesSpace = ctx.measureText(messageSpace);
      ctx.fillText(messageSpace, w / 2 - textMesSpace.width / 2, h / 2 + 48);
    }
  }

  private drawClouds(state: StateType, prev: StateType) {
    if (
      state.game.status !== GAME_STATUS.PLAY &&
      state.game.status === prev.game.status
    ) {
      return;
    }

    const ctx = this.getLayerContext("clouds");
    ctx.clearRect(0, 0, this.dimensions.w, this.dimensions.h);

    state.clouds.forEach((cloud, index) => {
      const image = document.getElementById(`cloud_${cloud.type}`);

      if (image instanceof HTMLImageElement) {
        const multix = image.width / image.height;
        ctx.drawImage(image, cloud.x, cloud.y, cloud.w, cloud.w / multix);
      }
    });
  }

  private drawBackdrop() {
    const ctx = this.getLayerContext("backdrop");

    const { w, h } = this.dimensions;

    window.addEventListener("load", (data) => {
      const image = document.getElementById("sky") as HTMLImageElement;
      ctx.drawImage(image, 0, 0, w, h);

      const imageRocks = document.getElementById("rocks") as HTMLImageElement;
      ctx.drawImage(imageRocks, 0, 0, w, h);
    });
  }

  private drawGround(state: StateType, prev: StateType) {
    const ctx = this.getLayerContext("ground");

    const { w, h } = this.dimensions;

    ctx.clearRect(0, 0, w, h);

    state.ground.forEach((groundLayer, index) => {
      const offsetX = Math.abs(groundLayer.x);
      const image = document.getElementById(
        `ground_${index + 1}`
      ) as HTMLImageElement;
      ctx.drawImage(image, -offsetX, 0, w, h);
      ctx.drawImage(image, w - offsetX, 0, w, h);
    });
  }

  private drawPlayer(state: StateType, prev: StateType) {
    if (
      state.game.status !== GAME_STATUS.PLAY &&
      state.game.status === prev.game.status
    ) {
      return;
    }

    const ctx = this.getLayerContext("player");

    ctx.clearRect(
      prev.player.x,
      prev.player.y,
      PLAYER_CONFIG.size[0],
      PLAYER_CONFIG.size[1]
    );

    const frame = Math.floor(state.player.frame);
    const imageFrame = state.player.jump
      ? `player-jump-${frame % 6}`
      : `player-move-${frame}`;
    const image = document.getElementById(imageFrame);

    if (image instanceof HTMLImageElement) {
      if (process.env.NODE_ENV === "development") {
        ctx.fillRect(
          state.player.x,
          state.player.y,
          PLAYER_CONFIG.size[0],
          PLAYER_CONFIG.size[1]
        );
      }
      ctx.drawImage(
        image,
        PLAYER_CONFIG.offset.x,
        PLAYER_CONFIG.offset.y,
        PLAYER_CONFIG.image.w,
        PLAYER_CONFIG.image.h,
        state.player.x,
        state.player.y,
        PLAYER_CONFIG.size[0],
        PLAYER_CONFIG.size[1]
      );
    }
  }

  private drawBarriers(state: StateType, prev: StateType) {
    if (
      state.game.status !== GAME_STATUS.PLAY &&
      state.game.status === prev.game.status
    ) {
      return;
    }

    const ctx = this.getLayerContext("barriers");

    prev.barriers.forEach((barrier, index) => {
      ctx.clearRect(barrier.x + 2, barrier.y, BARRIER_SIZE[0], BARRIER_SIZE[1]);
    });

    state.barriers.forEach((barrier, index) => {
      const image = document.getElementById(`monster`);

      if (image instanceof HTMLImageElement) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(
          image,
          -barrier.x,
          barrier.y,
          -BARRIER_SIZE[0],
          BARRIER_SIZE[1]
        );
        ctx.restore();
      }
    });
  }
}
