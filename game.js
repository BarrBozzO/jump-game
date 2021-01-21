var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var Drawer = /** @class */ (function () {
    function Drawer(canvas) {
        this.canvas = canvas;
    }
    Object.defineProperty(Drawer.prototype, "context", {
        get: function () {
            return this.canvas.getContext("2d");
        },
        enumerable: false,
        configurable: true
    });
    Drawer.prototype.getAreaDimensions = function () {
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    };
    Drawer.prototype.render = function (state) {
        // this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBackdrop(state);
        this.drawPlayer(state.player);
        this.drawBarriers(state.barriers);
    };
    Drawer.prototype.drawClouds = function (state) {
        var ctx = this.context;
        state.forEach(function (cloud, index) {
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, 10, 0, Math.PI * 2);
            ctx.fillStyle = Drawer.COLORS.cloud;
            ctx.fill();
            ctx.closePath();
            //   const { width } = this.getAreaDimensions();
            //   state[index].x = cloud.x < -100 ? width + 10 : cloud.x - 1;
            //   this.state.clouds[index].y = cloud.y + 1;
        });
    };
    Drawer.prototype.drawBackdrop = function (state) {
        var ctx = this.context;
        var _a = this.getAreaDimensions(), width = _a.width, height = _a.height;
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
    };
    Drawer.prototype.drawPlayer = function (state) {
        var ctx = this.context;
        ctx.beginPath();
        ctx.rect(state.x, state.y, 20, 40);
        ctx.fillStyle = Drawer.COLORS.player;
        ctx.fill();
        ctx.closePath();
    };
    Drawer.prototype.drawBarriers = function (state) {
        var ctx = this.context;
        state.forEach(function (barrier, index) {
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
    };
    Drawer.COLORS = {
        ground: "#ff0000",
        sky: "blue",
        cloud: "#fff",
        player: "#ff33ee"
    };
    return Drawer;
}());
var State = /** @class */ (function () {
    function State(dimensions) {
        this.state = {
            clouds: [
                {
                    x: 20,
                    y: 20
                },
                {
                    x: 40,
                    y: 40
                },
            ],
            player: {
                x: 0,
                y: 0,
                jump: null
            },
            barriers: [],
            world: {
                x: 0,
                y: 0,
                time: 0
            },
            game: {
                status: "started"
            }
        };
        this.dimensions = __assign({}, dimensions);
    }
    State.prototype.togglePause = function () {
        this.state.game.status =
            this.state.game.status === "paused" ? "started" : "paused";
    };
    State.prototype.toggleJump = function () {
        if (this.state.player.jump === null) {
            this.state.player.jump = {
                init: this.state.world.x
            };
        }
    };
    State.prototype.calculate = function () {
        var _this = this;
        var state = this.state;
        var nextState = __assign({}, this.state);
        if (state.game.status === "paused") {
            return;
        }
        nextState.world = __assign(__assign({}, this.state.world), { x: this.state.world.x + State.GAME_SPEED });
        // clouds
        state.clouds.forEach(function (cloud, index) {
            nextState.clouds[index].x =
                cloud.x < -100 ? _this.dimensions.w + 10 : cloud.x - State.CLOUD_SPEED;
        });
        // player
        var DEFAULT_X = 50;
        var DEFAULT_Y = this.dimensions.h - 60;
        var isJumping = Boolean(state.player.jump);
        var nextY = DEFAULT_Y;
        var nextJump = null;
        if (isJumping) {
            // y = (-x^2 + 50x) / 5
            var rangeFromJumpStart = state.world.x - state.player.jump.init;
            if (rangeFromJumpStart <= State.JUMP_LENGTH) {
                nextY -=
                    (State.JUMP_LENGTH * rangeFromJumpStart -
                        Math.pow(rangeFromJumpStart, 2)) /
                        (State.JUMP_LENGTH * 0.4);
                nextJump = state.player.jump;
                // debugger;
            }
        }
        nextState.player = {
            x: DEFAULT_X,
            y: nextY,
            jump: nextJump
        };
        // barriers
        nextState.barriers = state.barriers
            .map(function (barrier, index) {
            return __assign(__assign({}, barrier), { x: barrier.x - 1 });
        })
            .filter(function (barrier) { return barrier.x + barrier.w >= 0; });
        if (nextState.barriers.length < 1 && Math.random() % 10) {
            nextState.barriers.push({
                x: this.dimensions.w + 20,
                y: this.dimensions.h - 60,
                w: 20,
                h: 40
            });
        }
        this.state = __assign({}, nextState);
        return nextState;
    };
    State.GAME_SPEED = 2;
    State.CLOUD_SPEED = 2;
    State.JUMP_LENGTH = 150;
    return State;
}());
var DrawArea = /** @class */ (function () {
    function DrawArea(canvasDomId) {
        if (canvasDomId === void 0) { canvasDomId = ""; }
        var canvas = document.getElementById("" + canvasDomId);
        this.drawer = new Drawer(canvas);
        this.canvas = canvas;
        this.state = new State({ w: canvas.width, h: canvas.height });
    }
    DrawArea.prototype.init = function () {
        var $this = this;
        this.interval = setInterval(this.render.bind(this), 10);
        document.addEventListener("keydown", function (e) {
            if (e.code === "Pause") {
                $this.state.togglePause();
            }
            if (e.code === "Space") {
                $this.state.toggleJump();
            }
        });
    };
    DrawArea.prototype.render = function () {
        var currentState = this.state.calculate();
        this.drawer.render(currentState);
    };
    DrawArea.prototype.destroy = function () {
        this.interval = null;
    };
    return DrawArea;
}());
var area = new DrawArea("game");
area.init();
