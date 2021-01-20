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
        this.drawPlayer(state);
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
        var jumpLength = 50;
        console.log(state.world);
        ctx.beginPath();
        ctx.rect(state.player.x, state.player.y -
            (state.player.jump !== null
                ? state.world.x - state.player.jump.init >= jumpLength
                    ? 1
                    : state.world.x - state.player.jump.init
                : 0), 20, 40);
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
var DrawArea = /** @class */ (function () {
    function DrawArea(canvasDomId) {
        if (canvasDomId === void 0) { canvasDomId = ""; }
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
        var canvas = document.getElementById("" + canvasDomId);
        this.drawer = new Drawer(canvas);
        this.canvas = canvas;
    }
    DrawArea.prototype.init = function () {
        var $this = this;
        this.interval = setInterval(this.render.bind(this), 10);
        document.addEventListener("keydown", function (e) {
            console.log(e.code);
            if (e.code === "Pause") {
                $this.togglePause();
            }
            if (e.code === "Space") {
                $this.toggleJump();
            }
        });
    };
    DrawArea.prototype.togglePause = function () {
        this.state.game.status =
            this.state.game.status === "paused" ? "started" : "paused";
    };
    DrawArea.prototype.toggleJump = function () {
        if (this.state.player.jump === null) {
            console.log(this.state.player.jump);
            this.state.player.jump = {
                init: this.state.world.x
            };
        }
    };
    DrawArea.prototype.render = function () {
        this.calculateState();
        this.drawer.render(this.state);
    };
    DrawArea.prototype.calculateState = function () {
        var _this = this;
        var _a = this.canvas, width = _a.width, height = _a.height;
        var state = this.state;
        var nextState = __assign({}, this.state);
        if (state.game.status === "paused") {
            return;
        }
        nextState.world = __assign(__assign({}, this.state.world), { x: this.state.world.x + 1 });
        // clouds
        state.clouds.forEach(function (cloud, index) {
            nextState.clouds[index].x =
                cloud.x < -100 ? _this.canvas.width + 10 : cloud.x - 1;
        });
        // player
        nextState.player = {
            x: 50,
            y: height - 60,
            jump: state.player.jump === null ||
                state.world.x - state.player.jump.init > 100
                ? null
                : state.player.jump
        };
        // barriers
        nextState.barriers = state.barriers
            .map(function (barrier, index) {
            return __assign(__assign({}, barrier), { x: barrier.x - 1 });
        })
            .filter(function (barrier) { return barrier.x + barrier.w >= 0; });
        if (nextState.barriers.length < 1 && Math.random() % 10) {
            nextState.barriers.push({
                x: width + 20,
                y: height - 60,
                w: 20,
                h: 40
            });
        }
        this.state = __assign({}, nextState);
    };
    DrawArea.prototype.destroy = function () {
        this.interval = null;
    };
    return DrawArea;
}());
var area = new DrawArea("game");
area.init();
