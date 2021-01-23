import { stat } from "fs";
import { GAME_STATUS, PLAYER_CONFIG, BARRIER_SIZE } from "./constats";
import { StateType, GAME_STATUS_VALUE } from "./StateManager";
// import SKY_PICTURE from "./assets/sky.jpg";
const SKY_PICTURE = require("./assets/sky.jpg");

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
    ground: "#ff0000",
    sky: "blue",
    cloud: "#fff",
    player: "#ff33ee",
  };

  constructor(domElement: HTMLElement) {
    this.gameDomEl = domElement;

    ["backdrop", "clouds", "score", "barriers", "player", "message"].forEach(
      (layerId) => {
        this.createLayer(layerId);
      }
    );

    this.addAssets();
    this.drawBackdrop();
  }

  public reset() {
    ["clouds", "score", "barriers", "player", "message"].forEach((layerId) => {
      const ctx = this.getLayerContext(layerId);
      ctx.clearRect(0, 0, this.dimensions.w, this.dimensions.h);
    });
  }

  private addAssets() {
    const div = document.createElement("div");
    div.style["position"] = "absolute";
    div.style["left"] = "-9999px";
    div.style["top"] = "-9999px";

    // backdrop sky
    let img = document.createElement("img");
    img.setAttribute("src", SKY_PICTURE);
    img.setAttribute("id", "SKY_PICTURE");
    this.assets.push(img);
    div.append(img);

    // clouds
    img = document.createElement("img");
    img.setAttribute("src", require("./assets/cloud_1.png"));
    img.setAttribute("id", "cloud_1");
    this.assets.push(img);
    div.append(img);

    img = document.createElement("img");
    img.setAttribute("src", require("./assets/cloud_2.png"));
    img.setAttribute("id", "cloud_2");
    this.assets.push(img);
    div.append(img);

    img = document.createElement("img");
    img.setAttribute("src", require("./assets/cloud_3.png"));
    img.setAttribute("id", "cloud_3");
    this.assets.push(img);
    div.append(img);

    img = document.createElement("img");
    img.setAttribute("src", require("./assets/cloud_5.png"));
    img.setAttribute("id", "cloud_5");
    this.assets.push(img);
    div.append(img);

    img = document.createElement("img");
    img.setAttribute("src", require("./assets/cloud_4.png"));
    img.setAttribute("id", "cloud_4");
    this.assets.push(img);
    div.append(img);

    // monster
    img = document.createElement("img");
    img.setAttribute("src", require("./assets/monster.png"));
    img.setAttribute("id", "monster");
    this.assets.push(img);
    div.append(img);

    // player
    const frames = require(`./assets/player/move/*.png`);
    Object.values(frames).forEach((frame, index) => {
      img = document.createElement("img");
      img.setAttribute("src", frame as string);
      img.setAttribute("id", "player-move-" + index);
      this.assets.push(img);
      div.append(img);
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

    // sky
    const image = document.getElementById("SKY_PICTURE") as HTMLImageElement;
    image.onload = () => {
      ctx.drawImage(image, 0, 0, w, h);

      // ground
      ctx.beginPath();
      ctx.rect(0, h - 40, w, 40);
      ctx.fillStyle = Drawer.COLORS.ground;
      ctx.fill();
      ctx.closePath();
    };
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

    const imageFrame = `player-move-${Math.floor(state.player.frame)}`;
    const image = document.getElementById(imageFrame);

    if (image instanceof HTMLImageElement) {
      ctx.save();
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
      ctx.restore();
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
