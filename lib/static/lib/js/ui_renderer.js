//---------------------------------------------
//CANVAS FUNCTIONS
//---------------------------------------------

function UIRenderer() {
    // INITIALIZE CANVAS
    this.canvas = document.getElementById('game-ui');
    // Add mouse event handlers to the canvas
    $(this.canvas).mousemove(this.mouseMove.bind(this));
    $(this.canvas).mousedown(this.mouseDown.bind(this));
    $(this.canvas).mouseup(this.mouseUp.bind(this));
    $(this.canvas).bind('contextmenu', function(e) {
        return false;
    });
    // This stores the mouse's coordinates on a mousedown in order
    // to tell if a mouseup is either a click or a drag.
    this.coords = [undefined, undefined, undefined];
    this.currCoords = undefined;
    this.ctx = this.canvas.getContext("2d");
    this.ctx.textAlign = "center";
    this.ctx.font = "14px Helvetica";
    this.canvas.tabIndex = "0";
    this.CLICK_ERROR = 30;
    this.selecting = false;
}

// Generates a random hex color
UIRenderer.randomColor = function() {
    return "#" + Math.random().toString(16).slice(2, 8);
};

// Generates a rectangle {left, top, width, height} from two arbitrary points
UIRenderer.getRect = function(c1, c2) {
    var x1 = Math.min(c1.x, c2.x);
    var y1 = Math.min(c1.y, c2.y);
    var x2 = Math.max(c1.x, c2.x);
    var y2 = Math.max(c1.y, c2.y);
    return {
        "x": x1,
        "y": y1,
        "w": x2 - x1,
        "h": y2 - y1
        };
};

UIRenderer.prototype.clear = function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

// Draws a circle filled in with the color
UIRenderer.prototype.fillCircle = function(x, y, r, color) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2, true);
    this.ctx.fill();
};
// Draws a circle
UIRenderer.prototype.drawCircle = function(x, y, r, color) {
    this.ctx.strokeStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2, true);
    this.ctx.stroke();
};

// Render a player unit
UIRenderer.prototype.renderUnit = function(unit, color) {
    this.ctx.globalAlpha = 0.4;
    this.fillCircle(unit.pos.x, unit.pos.y, unit.size, color);
};

// Render the ring that highlights a unit if it is selected
UIRenderer.prototype.renderUnitSelectedHighlight = function(unit) {
    this.ctx.lineWidth = 5;
    this.ctx.globalAlpha = 1;
    this.drawCircle(unit.pos.x, unit.pos.y, unit.size - Math.floor(this.ctx.lineWidth / 2), '#00CC00');
};

UIRenderer.prototype.renderText = function(text, x, y, color)
{
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = 1;
    this.ctx.fillText(text, x, y);
}

UIRenderer.prototype.getCanvasCoords = function(e) {
    var posX = $(this.canvas).position().left,
        posY = $(this.canvas).position().top;
    var x = e.pageX - posX,
        y = e.pageY - posY;
    return {'x': x, 'y': y};
};

UIRenderer.prototype.mouseMove = function(e) {
    this.currCoords = this.getCanvasCoords(e);
};

UIRenderer.prototype.mouseDown = function(e) {
    this.coords[e.which - 1] = this.getCanvasCoords(e);
    if (e.which === 1) {
        this.selecting = true;
    }
    return false;
};

UIRenderer.prototype.mouseUp = function(e) {
    oldcoords = this.coords[e.which - 1];
    newcoords = this.getCanvasCoords(e);
    this.selecting = false;
    if (Math.abs(newcoords.x - oldcoords.x) < this.CLICK_ERROR &&
        Math.abs(newcoords.y - oldcoords.y) < this.CLICK_ERROR) {
        if (this.clickHandler) {
            this.clickHandler(e.which, newcoords);
        }
    } else {
        if (this.dragHandler) {
            this.dragHandler(e.which, oldcoords, newcoords);
        }
    }
    return false;
};

// The function you pass in must take two arguments: an int in range [1, 2, 3] where they
// correspond to [left, middle, right] mouse clicks, and a dictionary with entries 'x' and
// 'y' corresponding to the canvas-relative coordinates of the click.
UIRenderer.prototype.bindClick = function(clickHandler) {
    this.clickHandler = clickHandler;
};

// The function you pass in must take three arguments: an int in range [1, 2, 3] where they
// correspond to [left, middle, right] mouse click, and two dictionaries with entries 'x'
// and 'y' corresponding to the canvas-relative coordinates of the start of the drag and
// the end of the drag, in that order.
UIRenderer.prototype.bindDrag = function(dragHandler) {
    this.dragHandler = dragHandler;
};

UIRenderer.prototype.renderGS = function(gamestate, p_id) {
    var players = gamestate.players;
    players.forEach(function (player) {
        player.units.forEach(function(unit) {
            this.renderUnit(unit, player.color);
        }.bind(this));
    }.bind(this));
    players[p_id].selectedUnits.forEach(function(unit) {
        this.renderUnitSelectedHighlight(unit);
    }.bind(this));
};

UIRenderer.prototype.renderSelectRect = function() {
    this.ctx.fillStyle = "#00CC00";
    this.ctx.strokeStyle = "#00CC00";
    if (this.selecting) {
        var oldCoords = this.coords[0];
        var rect = UIRenderer.getRect(oldCoords, this.currCoords);
        this.ctx.beginPath();
        this.ctx.rect(rect.x, rect.y, rect.w, rect.h);
        this.ctx.globalAlpha = 0.2;
        this.ctx.fill();
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 1;
        this.ctx.stroke();
    }
};

UIRenderer.prototype.startRendering = function(render) {
    var boundRender = function() {
        this.clear();
        this.renderSelectRect();
        render();
        requestAnimationFrame(boundRender);
    }.bind(this);
    boundRender();
};
