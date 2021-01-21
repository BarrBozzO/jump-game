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
  status: "paused" | "started";
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
};

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
    ctx.rect(state.x, state.y, 20, 40);
    ctx.fillStyle = Drawer.COLORS.player;
    ctx.fill();
    ctx.closePath();
  }

  private drawBarriers(state: BarriersStateType) {
    const ctx = this.context;

    state.forEach((barrier, index) => {
      //   const { width } = this.getAreaDimensions();

      ctx.beginPath();
      ctx.rect(barrier.x, barrier.y, 20, 40);
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
      status: "started",
    },
  };

  constructor(dimensions) {
    this.dimensions = { ...dimensions };
  }

  public togglePause() {
    this.state.game.status =
      this.state.game.status === "paused" ? "started" : "paused";
  }

  public toggleJump() {
    if (this.state.player.jump === null) {
      this.state.player.jump = {
        init: this.state.world.x,
      };
    }
  }

  calculate() {
    const state = this.state;
    const nextState = {
      ...this.state,
    };

    if (state.game.status === "paused") {
      return;
    }

    nextState.world = {
      ...this.state.world,
      x: this.state.world.x + State.GAME_SPEED,
    };

    // clouds
    state.clouds.forEach((cloud, index) => {
      nextState.clouds[index].x =
        cloud.x < -100 ? this.dimensions.w + 10 : cloud.x - State.CLOUD_SPEED;
    });

    // player
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
        // debugger;
      }
    }
    nextState.player = {
      x: DEFAULT_X,
      y: nextY,
      jump: nextJump,
    };

    // barriers
    nextState.barriers = state.barriers
      .map((barrier, index) => {
        return {
          ...barrier,
          x: barrier.x - State.GAME_SPEED,
        };
      })
      .filter((barrier) => barrier.x + barrier.w >= 0);

    if (nextState.barriers.length < 1 && Math.random() % 10) {
      nextState.barriers.push({
        x: this.dimensions.w + 20,
        y: this.dimensions.h - 60,
        w: 20,
        h: 40,
      });
    }

    this.state = {
      ...nextState,
    };

    return nextState;
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
    this.interval = setInterval(this.render.bind(this), 10);

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
    const currentState = this.state.calculate();
    this.drawer.render(currentState);
  }

  destroy() {
    this.interval = null;
  }
}

const area = new DrawArea("game");
area.init();
