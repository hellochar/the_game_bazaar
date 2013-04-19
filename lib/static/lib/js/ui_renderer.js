//---------------------------------------------
//CANVAS FUNCTIONS
//---------------------------------------------

function UIRenderer(canvas) {
    // INITIALIZE CANVAS
    this.canvas = canvas;
    // Add mouse event handlers to the canvas
    $(this.canvas).mousemove(this.mouseMove.bind(this));
    $(this.canvas).mousedown(this.mouseDown.bind(this));
    $(this.canvas).mouseup(this.mouseUp.bind(this));
    $(this.canvas).mouseover(function(mevent) {
        $(this.canvas).focus();
    }.bind(this));
    $(this.canvas).keyup(this.keyUp.bind(this));
    $(this.canvas).keydown(this.keyDown.bind(this));
    $(this.canvas).bind('contextmenu', function(e) {
        return false;
    });
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    $(window).resize($.proxy(this.resize, this));

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

    this.selection = []; //An array of currently selected units
    this.scaleRatio = 800 / 10000;

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

UIRenderer.prototype.translatePos = function(x, y) {
    return this.scalePos(new THREE.Vector3((x + 5000), (-y + 5000), 0));
};

UIRenderer.prototype.scalePos = function(pos) {
    pos.x = pos.x * this.scaleRatio;
    pos.y = pos.y * this.scaleRatio;
    return pos;
};

UIRenderer.prototype.scaleSize = function(size) {
    return this.scaleRatio * size;
};

UIRenderer.prototype.clear = function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

// Draws a circle filled in with the color
UIRenderer.prototype.fillCircle = function(x, y, r, color) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    pos = this.translatePos(x, y);
    this.ctx.arc(pos.x, pos.y, this.scaleSize(r) * 3, 0, Math.PI * 2, true);
    this.ctx.fill();
};
// Draws a circle
UIRenderer.prototype.drawCircle = function(x, y, r, color) {
    this.ctx.strokeStyle = color;
    this.ctx.beginPath();
    pos = this.translatePos(x, y);
    this.ctx.arc(pos.x, pos.y, this.scaleSize(r) * 3, 0, Math.PI * 2, true);
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

UIRenderer.prototype.renderNodeConnection = function(startNode, endNode) {
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = 1;
    this.ctx.strokeStyle = "green";
    this.ctx.beginPath();
    startPos = this.translatePos(startNode.pos.x, startNode.pos.y);
    endPos = this.translatePos(endNode.pos.x, endNode.pos.y);
    this.ctx.moveTo(startPos.x, startPos.y);
    this.ctx.lineTo(endPos.x, endPos.y);
    this.ctx.stroke();
};

UIRenderer.prototype.renderText = function(text, x, y, color)
{
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = 1;
    this.ctx.fillText(text, x, y);
};

UIRenderer.prototype.getCanvasCoords = function(e) {
    var posX = $(this.canvas).offset().left,
        posY = $(this.canvas).offset().top;
    var x = e.pageX - posX,
        y = e.pageY - posY;
    return new THREE.Vector3(x, y, 0);
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
    if (newcoords.clone().sub(oldcoords).length() < this.CLICK_ERROR) {
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

UIRenderer.prototype.keyUp = function(e) {
    if (this.keyUpHandler) {
        this.keyUpHandler(e.keyCode || e.which);
    }
    return false;
};

// make sure we don't do anything on a keydown.
UIRenderer.prototype.keyDown = function(e) {
    if (this.keyDownHandler) {
        this.keyDownHandler(e.keyCode || e.which);
    }
    return false;
};

// The function you pass in must take two arguments: an int in range [1, 2, 3] where they
// correspond to [left, middle, right] mouse clicks, and a Vector3
// corresponding to the canvas-relative coordinates of the click.
UIRenderer.prototype.bindClick = function(clickHandler) {
    this.clickHandler = clickHandler;
};

// The function you pass in must take three arguments: an int in range [1, 2, 3] where they
// correspond to [left, middle, right] mouse click, and two Vector3s
// corresponding to the canvas-relative coordinates of the start of the drag and
// the end of the drag, in that order.
UIRenderer.prototype.bindDrag = function(dragHandler) {
    this.dragHandler = dragHandler;
};

// The function you pass in must take one argument: the keycode of the button pressed.
// This function will trigger when the keyup function is triggered.
UIRenderer.prototype.bindKeyUp = function(keyUpHandler) {
    this.keyUpHandler = keyUpHandler;
};

// The function you pass in must take one argument: the keycode of the button pressed.
// This function will trigger when the keyup function is triggered.
UIRenderer.prototype.bindKeyDown = function(keyDownHandler) {
    this.keyDownHandler = keyDownHandler;
};

UIRenderer.prototype.renderGS = function(gamestate) {
    var players = gamestate.players;
    players.forEach(function (player) {
        player.units.forEach(function(unit) {
            this.renderUnit(unit, player.color);
        }.bind(this));
    }.bind(this));

    gamestate.obstacles.nodes.forEach(function (startNode) {
        startNode.connections.forEach(function (endNode) {
            this.renderNodeConnection(startNode, endNode);
        }.bind(this));
    }.bind(this));

};

UIRenderer.prototype.renderMap = function() {
    // Draw the map background
    this.ctx.fillStyle = "#00FF00";
    this.ctx.strokeStyle = "#00CC00";
    this.ctx.globalAlpha = 0.2;
    this.ctx.beginPath();
    this.ctx.rect(0, 0, 800, 800);
    this.ctx.fill();
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = 1;
    this.ctx.stroke();
};

UIRenderer.prototype.renderViewPort = function(d1, d2, d3, d4) {
    // Draw the map background
    this.ctx.strokeStyle = "#FFFFFF";
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = 1;
    this.ctx.beginPath();

    d1 = this.translatePos(d1.x, d1.y);
    d2 = this.translatePos(d2.x, d2.y);
    d3 = this.translatePos(d3.x, d3.y);
    d4 = this.translatePos(d4.x, d4.y);

    this.ctx.moveTo(d1.x, d1.y);
    this.ctx.lineTo(d2.x, d2.y);
    this.ctx.lineTo(d3.x, d3.y);
    this.ctx.lineTo(d4.x, d4.y);
    this.ctx.closePath();
    this.ctx.stroke();
};

UIRenderer.prototype.renderSelectionCircles = function(selection) {
    selection.forEach(function(unit) {
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

UIRenderer.prototype.resize = function() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
};

UIRenderer.prototype.startRendering = function(renderMethod) {
    var boundRender = function() {
        this.clear();
        renderMethod();
        requestAnimationFrame(boundRender);
    }.bind(this);
    boundRender();
};
