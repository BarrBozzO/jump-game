type GAME_STATUS_KEY = "OVER" | "PAUSED" | "PLAY";
type GAME_STATUS_VALUE = "over" | "paused" | "play";
const GAME_STATUS: {
  OVER: "over";
  PAUSE: "paused";
  PLAY: "play";
} = {
  OVER: "over",
  PAUSE: "paused",
  PLAY: "play",
};

type CloudsStateType = {
  x: number;
  y: number;
}[];

type PlayerStateType = {
  x: number;
  y: number;
  jump: {
    init: number;
  } | null;
};

type WorldStateType = {
  x: number;
  y: number;
  time: number;
};

type GameStateType = {
  status: GAME_STATUS_VALUE;
};

type BarriersStateType = {
  x: number;
  y: number;
  w: number;
  h: number;
}[];

type StateType = {
  clouds: CloudsStateType;
  player: PlayerStateType;
  barriers: BarriersStateType;
  world: WorldStateType;
  game: GameStateType;
  score: number;
};

type LayerType = {
  id: string;
  dom: HTMLCanvasElement;
};

const PLAYER_SIZE = [40, 80];
const BARRIER_SIZE = [40, 80];

class Drawer {
  private gameDomEl: HTMLElement;
  private layers: {
    [key: string]: LayerType;
  } = {};
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

    this.drawBackdrop();
  }

  public reset() {
    ["clouds", "score", "barriers", "player", "message"].forEach((layerId) => {
      const ctx = this.getLayerContext(layerId);
      ctx.clearRect(0, 0, this.dimensions.w, this.dimensions.h);
    });
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
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = Drawer.COLORS.cloud;
      ctx.fill();
      ctx.closePath();
    });
  }

  private drawBackdrop() {
    const ctx = this.getLayerContext("backdrop");

    const { w, h } = this.dimensions;

    // sky
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.fillStyle = Drawer.COLORS.sky;
    ctx.fill();
    ctx.closePath();

    // ground
    ctx.beginPath();
    ctx.rect(0, h - 40, w, 40);
    ctx.fillStyle = Drawer.COLORS.ground;
    ctx.fill();
    ctx.closePath();
  }

  private drawPlayer(state: StateType, prev: StateType) {
    if (
      state.game.status !== GAME_STATUS.PLAY &&
      state.game.status === prev.game.status
    ) {
      return;
    }

    const ctx = this.getLayerContext("player");

    ctx.clearRect(prev.player.x, prev.player.y, PLAYER_SIZE[0], PLAYER_SIZE[1]);

    ctx.beginPath();
    ctx.rect(state.player.x, state.player.y, PLAYER_SIZE[0], PLAYER_SIZE[1]);
    ctx.fillStyle = Drawer.COLORS.player;
    ctx.fill();
    ctx.closePath();
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
      ctx.beginPath();
      ctx.rect(barrier.x, barrier.y, BARRIER_SIZE[0], BARRIER_SIZE[1]);
      ctx.fillStyle = Drawer.COLORS.cloud;
      ctx.fill();
      ctx.closePath();
    });
  }
}

class State {
  static GAME_SPEED = 10;
  static BARRIER_SPEED = 10;
  static CLOUD_SPEED = 2;
  static JUMP_LENGTH = 200;

  static getInitState = () => ({
    clouds: [
      {
        x: 20,
        y: 20,
      },
      {
        x: 40,
        y: 40,
      },
    ],
    player: {
      x: 0,
      y: 0,
      jump: null,
    },
    barriers: [],
    world: {
      x: 0,
      y: 0,
      time: 0,
    },
    game: {
      status: GAME_STATUS.PLAY as GAME_STATUS_VALUE,
    },
    score: 0,
  });

  private prevState: string = "";
  private dimensions: {
    w: number;
    h: number;
  };
  private state: StateType = State.getInitState();

  constructor(dimensions) {
    this.dimensions = { ...dimensions };
  }

  public togglePause() {
    this.state.game.status = (this.state.game.status === GAME_STATUS.PAUSE
      ? GAME_STATUS.PLAY
      : GAME_STATUS.PAUSE) as GAME_STATUS_VALUE;
  }

  public toggleJump() {
    if (this.state.player.jump === null) {
      this.state.player.jump = {
        init: this.state.world.x,
      };
    }
  }

  public togglePlayAgain() {
    this.resetState();
  }

  get() {
    return { current: this.state, prev: JSON.parse(this.prevState) };
  }

  calculate() {
    const state = this.state;
    const nextState = {
      ...this.state,
    };

    this.prevState = JSON.stringify(this.state);

    if (
      state.game.status === GAME_STATUS.OVER ||
      state.game.status === GAME_STATUS.PAUSE
    ) {
      return;
    }

    nextState.score = this.calculateScore(state);
    nextState.world = this.calculateWorld(state);

    // clouds
    nextState.clouds = this.calculateClouds(state);

    // player
    nextState.player = this.calculatePlayer(state);

    // barriers
    nextState.barriers = this.calculateBarriers(state);

    // collision
    nextState.game.status = this.calculateCollision(
      state,
      nextState.player,
      nextState.barriers
    );

    this.state = {
      ...nextState,
    };

    return nextState;
  }

  private resetState() {
    // debugger;
    // this.prevState = JSON.stringify(this.state);
    this.state = State.getInitState();
  }

  private calculateScore(state: StateType) {
    return state.score + 1;
  }

  private calculateWorld(state: StateType) {
    return {
      ...state.world,
      x: state.world.x + State.GAME_SPEED,
    };
  }

  private calculateCollision(
    state: StateType,
    player: PlayerStateType,
    barriers: BarriersStateType
  ) {
    const isGameOver = barriers.some((barrier) => {
      const leftBottomPlayer = [player.x, player.y];
      const rightTopPlayer = [
        player.x + PLAYER_SIZE[0],
        player.y + PLAYER_SIZE[1],
      ];

      const leftBottomBarrier = [barrier.x, barrier.y];
      const rightTopBarrier = [
        barrier.x + BARRIER_SIZE[0],
        barrier.y + BARRIER_SIZE[1],
      ];

      const left = Math.max(leftBottomPlayer[0], leftBottomBarrier[0]);
      const top = Math.min(rightTopPlayer[1], rightTopBarrier[1]);
      const right = Math.min(rightTopPlayer[0], rightTopBarrier[0]);
      const bottom = Math.max(leftBottomPlayer[1], leftBottomBarrier[1]);

      const width = right - left;
      const height = top - bottom;

      return width > 0 && height > 0;
    });

    return isGameOver ? GAME_STATUS.OVER : state.game.status;
  }

  private calculateClouds(state: StateType) {
    return state.clouds.map((cloud, index) => {
      return {
        ...cloud,
        x:
          cloud.x < -100 ? this.dimensions.w + 10 : cloud.x - State.CLOUD_SPEED,
      };
    });
  }

  private calculatePlayer(state: StateType) {
    const DEFAULT_X = PLAYER_SIZE[0] * 2;
    const DEFAULT_Y = this.dimensions.h - PLAYER_SIZE[1] * 1.5;
    const isJumping = Boolean(state.player.jump);

    let nextY = DEFAULT_Y;
    let nextJump = null;

    if (isJumping) {
      // y = (-x^2 + 50x) / 5
      const rangeFromJumpStart = state.world.x - state.player.jump.init;
      if (rangeFromJumpStart <= State.JUMP_LENGTH) {
        nextY -= Math.round(
          (State.JUMP_LENGTH * rangeFromJumpStart -
            Math.pow(rangeFromJumpStart, 2)) /
            (State.JUMP_LENGTH * 0.35)
        );
        nextJump = state.player.jump;
      }
    }

    return {
      x: DEFAULT_X,
      y: nextY,
      jump: nextJump,
    };
  }

  private calculateBarriers(state: StateType) {
    let result = [];
    result = state.barriers
      .map((barrier, index) => {
        return {
          ...barrier,
          x: barrier.x - State.BARRIER_SPEED,
        };
      })
      .filter((barrier) => barrier.x + barrier.w >= 0);

    const barrirStateEntity = {
      x: this.dimensions.w + BARRIER_SIZE[0],
      y: this.dimensions.h - BARRIER_SIZE[1] * 1.5,
      w: BARRIER_SIZE[0],
      h: BARRIER_SIZE[1],
    };

    if (result.length < 1 && this.getRandomInt(0, 100) % 10 === 0) {
      result.push(barrirStateEntity);
    } else if (result.length === 1) {
      if (this.dimensions.w - result[0].x >= 150) {
        if (this.getRandomInt(0, 100) % 30 === 0) {
          result.push(barrirStateEntity);
        }
      }
    }

    return result;
  }

  private getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }
}

class Game {
  private gameDomEl: HTMLElement;
  private drawer: Drawer;
  private state: State;

  constructor(domId: string = "") {
    this.gameDomEl = document.getElementById(`${domId}`) as HTMLElement;
    this.drawer = new Drawer(this.gameDomEl);
    this.state = new State({
      w: this.gameDomEl.offsetWidth,
      h: this.gameDomEl.offsetHeight,
    });
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
    this.drawer.render(this.state.get());
    requestAnimationFrame(this.play.bind(this));
  }

  destroy() {}
}

const area = new Game("game");
area.init();
