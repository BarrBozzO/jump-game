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
    this.drawPlayer(state);
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

  private drawPlayer(state: StateType) {
    const ctx = this.context;

    const jumpLength = 50;

    console.log(state.world);

    ctx.beginPath();
    ctx.rect(
      state.player.x,
      state.player.y -
        (state.player.jump !== null
          ? state.world.x - state.player.jump.init >= jumpLength
            ? 1
            : state.world.x - state.player.jump.init
          : 0),
      20,
      40
    );
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

class DrawArea {
  private canvas: HTMLCanvasElement;
  private drawer: Drawer;
  private interval: number | null;
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

  constructor(canvasDomId: string = "") {
    const canvas = document.getElementById(
      `${canvasDomId}`
    ) as HTMLCanvasElement;
    this.drawer = new Drawer(canvas);
    this.canvas = canvas;
  }

  init() {
    const $this = this;
    this.interval = setInterval(this.render.bind(this), 10);

    document.addEventListener("keydown", (e) => {
      console.log(e.code);
      if (e.code === "Pause") {
        $this.togglePause();
      }

      if (e.code === "Space") {
        $this.toggleJump();
      }
    });
  }

  private togglePause() {
    this.state.game.status =
      this.state.game.status === "paused" ? "started" : "paused";
  }

  private toggleJump() {
    if (this.state.player.jump === null) {
      console.log(this.state.player.jump);
      this.state.player.jump = {
        init: this.state.world.x,
      };
    }
  }

  private render() {
    this.calculateState();
    this.drawer.render(this.state);
  }

  private calculateState() {
    const { width, height } = this.canvas;

    const state = this.state;
    const nextState = {
      ...this.state,
    };

    if (state.game.status === "paused") {
      return;
    }

    nextState.world = {
      ...this.state.world,
      x: this.state.world.x + 1,
    };

    // clouds
    state.clouds.forEach((cloud, index) => {
      nextState.clouds[index].x =
        cloud.x < -100 ? this.canvas.width + 10 : cloud.x - 1;
    });

    // player
    nextState.player = {
      x: 50,
      y: height - 60,
      jump:
        state.player.jump === null ||
        state.world.x - state.player.jump.init > 100
          ? null
          : state.player.jump,
    };

    // barriers
    nextState.barriers = state.barriers
      .map((barrier, index) => {
        return {
          ...barrier,
          x: barrier.x - 1,
        };
      })
      .filter((barrier) => barrier.x + barrier.w >= 0);

    if (nextState.barriers.length < 1 && Math.random() % 10) {
      nextState.barriers.push({
        x: width + 20,
        y: height - 60,
        w: 20,
        h: 40,
      });
    }

    this.state = {
      ...nextState,
    };
  }

  destroy() {
    this.interval = null;
  }
}

const area = new DrawArea("game");
area.init();
