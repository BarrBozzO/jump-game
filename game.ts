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

const PLAYER_SIZE = [20, 40];
const BARRIER_SIZE = [20, 40];

class Drawer {
  private canvas: HTMLCanvasElement;

  static COLORS = {
    ground: "#ff0000",
    sky: "blue",
    cloud: "#fff",
    player: "#ff33ee",
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  get context() {
    return this.canvas.getContext("2d");
  }

  private getAreaDimensions(): { width: number; height: number } {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }

  render(state: StateType) {
    // this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackdrop(state);
    this.drawPlayer(state.player);
    this.drawBarriers(state.barriers);
  }

  private drawClouds(state: CloudsStateType) {
    const ctx = this.context;

    state.forEach((cloud, index) => {
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = Drawer.COLORS.cloud;
      ctx.fill();
      ctx.closePath();

      //   const { width } = this.getAreaDimensions();
      //   state[index].x = cloud.x < -100 ? width + 10 : cloud.x - 1;
      //   this.state.clouds[index].y = cloud.y + 1;
    });
  }

  private drawBackdrop(state: StateType) {
    const ctx = this.context;

    const { width, height } = this.getAreaDimensions();

    // sky
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.fillStyle = Drawer.COLORS.sky;
    ctx.fill();
    ctx.closePath();

    this.drawClouds(state.clouds);

    // ground
    ctx.beginPath();
    ctx.rect(0, height - 40, width, 40);
    ctx.fillStyle = Drawer.COLORS.ground;
    ctx.fill();
    ctx.closePath();
  }

  private drawPlayer(state: PlayerStateType) {
    const ctx = this.context;

    ctx.beginPath();
    ctx.rect(state.x, state.y, PLAYER_SIZE[0], PLAYER_SIZE[1]);
    ctx.fillStyle = Drawer.COLORS.player;
    ctx.fill();
    ctx.closePath();
  }

  private drawBarriers(state: BarriersStateType) {
    const ctx = this.context;

    state.forEach((barrier, index) => {
      //   const { width } = this.getAreaDimensions();

      ctx.beginPath();
      ctx.rect(barrier.x, barrier.y, BARRIER_SIZE[0], BARRIER_SIZE[1]);
      ctx.fillStyle = Drawer.COLORS.cloud;
      ctx.fill();
      ctx.closePath();

      //   state[index].x =
      //     barrier.x < -100 ? width + 10 : barrier.x - 1;
      //   this.state.clouds[index].y = cloud.y + 1;
    });
  }
}

class State {
  static GAME_SPEED = 2;
  static CLOUD_SPEED = 2;
  static JUMP_LENGTH = 150;

  private dimensions: {
    w: number;
    h: number;
  };
  private state: StateType = {
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
  };

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

  get() {
    return this.state;
  }

  calculate() {
    const state = this.state;
    const nextState = {
      ...this.state,
    };

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
    /*
#include <algorithm>


    x1, y1 - левая нижняя точка первого прямоугольника
    x2, y2 - правая верхняя точка первого прямоугольника
    x3, y3 - левая нижняя точка второго прямоугольника
    x4, y4 - правая верхняя точка второго прямоугольника

int f(int x1, int y1, int x2, int y2, int x3, int y3, int x4, int y4)
{
    int left = std::max(x1, x3);
    int top = std::min(y2, y4);
    int right = std::min(x2, x4);
    int bottom = std::max(y1, y3);

    int width = right - left;
    int height = top - bottom;

    if (width < 0 || height < 0)
        return 0;

    return width * height;
}
**/

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
    const DEFAULT_X = 50;
    const DEFAULT_Y = this.dimensions.h - 60;
    const isJumping = Boolean(state.player.jump);

    let nextY = DEFAULT_Y;
    let nextJump = null;

    if (isJumping) {
      // y = (-x^2 + 50x) / 5
      const rangeFromJumpStart = state.world.x - state.player.jump.init;
      if (rangeFromJumpStart <= State.JUMP_LENGTH) {
        nextY -=
          (State.JUMP_LENGTH * rangeFromJumpStart -
            Math.pow(rangeFromJumpStart, 2)) /
          (State.JUMP_LENGTH * 0.45);
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
          x: barrier.x - State.GAME_SPEED,
        };
      })
      .filter((barrier) => barrier.x + barrier.w >= 0);

    if (result.length < 1 && Math.random() % 10) {
      result.push({
        x: this.dimensions.w + 20,
        y: this.dimensions.h - 60,
        w: 20,
        h: 40,
      });
    }

    return result;
  }
}

class DrawArea {
  private canvas: HTMLCanvasElement;
  private drawer: Drawer;
  private interval: number | null;
  private state: State;

  constructor(canvasDomId: string = "") {
    const canvas = document.getElementById(
      `${canvasDomId}`
    ) as HTMLCanvasElement;
    this.drawer = new Drawer(canvas);
    this.canvas = canvas;
    this.state = new State({ w: canvas.width, h: canvas.height });
  }

  init() {
    const $this = this;
    this.initState();
    this.render();

    document.addEventListener("keydown", (e) => {
      if (e.code === "Pause") {
        $this.state.togglePause();
      }

      if (e.code === "Space") {
        $this.state.toggleJump();
      }
    });
  }

  private render() {
    const currentState = this.state.get();
    this.drawer.render(currentState);
    requestAnimationFrame(this.render.bind(this));
  }

  private initState() {
    this.interval = setInterval(this.state.calculate.bind(this.state), 10);
  }

  destroy() {
    this.interval = null;
  }
}

const area = new DrawArea("game");
area.init();
