import {
  GAME_STATUS,
  PLAYER_CONFIG,
  BARRIER_SIZE,
  GROUND_SIZE,
  JUMP_LENGTH,
} from "./constats";

export type GAME_STATUS_KEY = "OVER" | "PAUSED" | "PLAY";
export type GAME_STATUS_VALUE = "over" | "paused" | "play";

export type StateType = {
  clouds: CloudsStateType;
  player: PlayerStateType;
  barriers: BarriersStateType;
  world: WorldStateType;
  game: GameStateType;
  score: number;
  ground: GroundStateType;
};

type CloudsStateType = {
  x: number | null;
  y: number;
  type: number;
  w: number;
  offsetX: number;
}[];

type PlayerStateType = {
  x: number;
  y: number;
  jump: {
    init: number;
  } | null;
  frame: number;
};

type WorldStateType = {
  x: number;
  y: number;
  time: number;
  speedRate: number;
};

type GroundStateType = {
  x: number;
}[];

type GameStateType = {
  status: GAME_STATUS_VALUE;
};

type BarriersStateType = {
  x: number;
  y: number;
  w: number;
  h: number;
}[];

export default class State {
  static GAME_SPEED = 10;
  static BARRIER_SPEED = 5;
  static MAX_SPEED = 20;
  static CLOUD_SPEED = 2;

  static getInitState = () => ({
    clouds: [
      {
        offsetX: 0,
        x: 0,
        y: 0,
        type: 1,
        w: 900,
      },
      {
        offsetX: 0,
        x: 500,
        y: 220,
        type: 2,
        w: 200,
      },
      {
        offsetX: 0,
        x: 800,
        y: 60,
        type: 2,
        w: 400,
      },
      {
        offsetX: 0,
        x: 1280,
        y: 0,
        type: 1,
        w: 500,
      },
      {
        offsetX: 0,
        x: 1700,
        y: 150,
        type: 2,
        w: 200,
      },
      {
        offsetX: 0,
        x: 1500,
        y: 200,
        type: 2,
        w: 100,
      },
    ],
    player: {
      x: 0,
      y: 0,
      jump: null,
      frame: 0,
    },
    barriers: [],
    world: {
      x: 0,
      y: 0,
      time: 0,
      speedRate: 1,
    },
    game: {
      status: GAME_STATUS.PLAY as GAME_STATUS_VALUE,
    },
    score: 0,
    ground: [
      {
        x: 0,
      },
      { x: 0 },
      { x: 0 },
    ],
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

    // ground
    nextState.ground = this.calculateGround(state);

    // player
    nextState.player = this.calculatePlayer(state);

    // barriers
    nextState.barriers = this.calculateBarriers(state);

    // collision
    nextState.game.status = this.calculateCollision(state);

    this.state = {
      ...nextState,
    };

    return nextState;
  }

  private resetState() {
    this.state = State.getInitState();
  }

  private calculateScore(state: StateType) {
    return state.score + 1;
  }

  private calculateWorld(state: StateType) {
    return {
      ...state.world,
      speedRate: Math.max(Math.round(state.score / 1000), 1),
      x: state.world.x + State.GAME_SPEED,
    };
  }

  private calculateCollision(state: StateType) {
    const { game, barriers, player } = state;
    const DEC_RATE = 0.15;
    const isGameOver = barriers.some((barrier) => {
      const playerBottomSide =
        player.y + PLAYER_CONFIG.size[1] - PLAYER_CONFIG.size[1] * DEC_RATE;
      const playerLeftSide = player.x + PLAYER_CONFIG.size[0] * DEC_RATE;
      const playerRightSide =
        player.x + PLAYER_CONFIG.size[0] - PLAYER_CONFIG.size[0] * DEC_RATE;

      const barrierTopSide = barrier.y + BARRIER_SIZE[1] * DEC_RATE;
      const barrierLeftSide = barrier.x + BARRIER_SIZE[0] * DEC_RATE;
      const barrierRightSide =
        barrier.x + BARRIER_SIZE[0] - BARRIER_SIZE[0] * DEC_RATE;

      return playerBottomSide < barrierTopSide ||
        playerRightSide < barrierLeftSide ||
        playerLeftSide > barrierRightSide
        ? false
        : true;
    });

    return isGameOver ? GAME_STATUS.OVER : game.status;
  }

  private calculateClouds(state: StateType) {
    return state.clouds.map((cloud, index) => {
      const { w, h } = this.dimensions;

      const nextX =
        cloud.x < -cloud.w
          ? w + cloud.offsetX
          : cloud.x - State.CLOUD_SPEED * 0.1;
      return {
        ...cloud,
        x: nextX,
      };
    });
  }

  private calculateGround(state: StateType) {
    return state.ground.map((ground, index) => {
      return {
        x:
          Math.abs(ground.x) >= this.dimensions.w
            ? 0
            : ground.x - Math.pow(index, 2) /** 0.1*/,
      };
    });
  }

  private calculatePlayer(state: StateType) {
    const DEFAULT_X = PLAYER_CONFIG.size[0] * 2;
    const DEFAULT_Y = this.dimensions.h - PLAYER_CONFIG.size[1] - GROUND_SIZE;
    const isJumping = Boolean(state.player.jump);

    let nextY = DEFAULT_Y;
    let nextJump = null;

    if (isJumping) {
      // y = (-x^2 + 50x) / 5
      const rangeFromJumpStart = state.world.x - state.player.jump.init;
      if (rangeFromJumpStart <= JUMP_LENGTH) {
        nextY -= Math.round(
          (JUMP_LENGTH * rangeFromJumpStart - Math.pow(rangeFromJumpStart, 2)) /
            (JUMP_LENGTH * 0.5)
        );
        nextJump = state.player.jump;
      }
    }

    return {
      x: DEFAULT_X,
      y: nextY,
      jump: nextJump,
      frame:
        state.player.frame < PLAYER_CONFIG.frames.run - 1
          ? state.player.frame + 0.5
          : 0,
    };
  }

  private calculateBarriers(state: StateType) {
    let result = [];
    result = state.barriers
      .map((barrier) => {
        return {
          ...barrier,
          x:
            barrier.x -
            Math.min(
              State.BARRIER_SPEED + state.world.speedRate,
              State.MAX_SPEED
            ),
        };
      })
      .filter((barrier) => barrier.x + barrier.w >= 0);

    const barrirStateEntity = {
      x: this.dimensions.w + BARRIER_SIZE[0],
      y: this.dimensions.h - BARRIER_SIZE[1] - 40,
      w: BARRIER_SIZE[0],
      h: BARRIER_SIZE[1],
    };

    // adding new barriers
    if (result.length < 1 && this.getRandomInt(0, 100) % 10 === 0) {
      result.push(barrirStateEntity);
    } else if (
      result.length === 1 &&
      this.dimensions.w - result[0].x >= JUMP_LENGTH * 0.6
    ) {
      if (this.getRandomInt(0, 100) % 30 === 0) {
        result.push(barrirStateEntity);
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
