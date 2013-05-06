//---------------------------------------------
//CANVAS FUNCTIONS
//---------------------------------------------

function UIRenderer(canvas) {
    this.canvas = canvas;

    // Add mouse event handlers to the canvas
    $(this.canvas).mousemove(this.mouseMove.bind(this));
    $(this.canvas).mousedown(this.mouseDown.bind(this));
    $(this.canvas).mouseup(this.mouseUp.bind(this));
    $(this.canvas).mouseover(function(mevent) {
        $(this.canvas).focus();
    }.bind(this));

    // key listeners
    $(this.canvas).keyup(this.keyUp.bind(this));
    $(this.canvas).keydown(this.keyDown.bind(this));


    $(this.canvas).bind('contextmenu', function(e) {
        return false;
    });
    $(window).resize($.proxy(this.resize, this));
    this.resize();

    // stores the mouse's coordinates on a mousedown for each mouse button (left, middle, right);
    // coords[0] is unused. use this.coords[evt.which] to retrieve the mouse coordinates for the event
    this.coords = [undefined, null, null, null];


    // Canvas coordinates of the last mouseMove event (stored as a Vector3 with z=0)
    this.currCoords = undefined;


    // If you drag and release for less than this pixel distance in the canvas,
    // UIRenderer will trigger a click event instead of a drag event. This helps
    // prevent accidental small drags
    this.CLICK_ERROR = 30;


    // This variable is true while you're in the middle of clicking and dragging a selection
    // rectangle. renderSelectRect will only draw itself while selecting = true.
    this.selecting = false;


    // All things being rendered will be scaled by scaleRatio, in order to draw the whole minimap
    this.scaleRatio = 800 / 10000;

    // The minimap is a square of side lengths equal to this value.
    this.minimapSize = 200;

    // Get the graphics functions from the canvas.
    this.ctx = this.canvas.getContext("2d");
    // Set the font
    this.ctx.textAlign = "center";
    this.ctx.font = "14px Helvetica";
    // When user presses tab, go to canvas.
    this.canvas.tabIndex = "0";
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
    var pos = this.translatePos(x, y);
    this.ctx.arc(pos.x, pos.y, this.scaleSize(r), 0, Math.PI * 2, true);
    this.ctx.fill();
};
// Draws a circle
UIRenderer.prototype.drawCircle = function(x, y, r, color) {
    this.ctx.strokeStyle = color;
    this.ctx.beginPath();
    var pos = this.translatePos(x, y);
    this.ctx.arc(pos.x, pos.y, this.scaleSize(r), 0, Math.PI * 2, true);
    this.ctx.stroke();
};

// Render a player unit
UIRenderer.prototype.renderUnit = function(unit, color, terrain) {
    this.ctx.globalAlpha = 0.4;
    this.fillCircle(unit.pos.x, unit.pos.y, unit.size, color);
    if(this.drawUnitInfo === true) {
        this.ctx.globalAlpha = 1;
        var pos = this.translatePos(unit.pos.x, unit.pos.y);
        this.ctx.fillText(unit.speed, pos.x, pos.y);
    }
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
    if(e.which !== 0) {
        if(this.dragMoveHandler) {
            this.dragMoveHandler(e.which, this.coords[e.which], this.currCoords);
        }
    }
};

UIRenderer.prototype.mouseDown = function(e) {
    this.coords[e.which] = this.getCanvasCoords(e);
    if (e.which === 1) {
        this.selecting = true;
    }
    return false;
};

// UIRenderer.prototype.

//mouseUp is reponsible for sending either a clickHandler or a dragHandler message
UIRenderer.prototype.mouseUp = function(e) {
    oldcoords = this.coords[e.which];
    newcoords = this.getCanvasCoords(e);
    this.selecting = false;
    if (newcoords.clone().sub(oldcoords).length() < this.CLICK_ERROR) {
        if (this.clickHandler) {
            this.clickHandler(e.which, newcoords);
        }
    } else {
        if (this.dragEndHandler) {
            this.dragEndHandler(e.which, oldcoords, newcoords);
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
UIRenderer.prototype.bindDragEnd = function(dragEndHandler) {
    this.dragEndHandler = dragEndHandler;
};

// dragMoveHandler = function(
//      mouse button [1,2,3],
//      start of drag in canvas coordinates,
//      end of drag in canvas coordinates
// )
UIRenderer.prototype.bindDragMove = function(dragMoveHandler) {
    this.dragMoveHandler = dragMoveHandler;
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

UIRenderer.prototype.renderGS = function(gamestate, player_id) {
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

    if (player_id !== undefined) {
        this.renderWinOrLoseText(gamestate.players[player_id]);
    }
};

UIRenderer.prototype.renderWinOrLoseText = function(player) {
    var old_font = this.ctx.font;
    this.ctx.font = "72px Cuckoo";
    var leftInd = this.canvas.width / 2 - 120;
    var topInd = this.canvas.height / 2 - 40;
    if (player.state === PlayerState.LOST) {
        this.renderText("You have been defeated.", leftInd, topInd, "blue");
    }
    if (player.state === PlayerState.WON) {
        this.renderText("You are victorious!", leftInd, topInd, "green");
    }
    this.ctx.font = old_font;
};

UIRenderer.prototype.renderMap = function(gamestate, player_id) {
    // Draw the map background
    this.ctx.fillStyle = "#00FF00";
    this.ctx.strokeStyle = "#00CC00";
    this.ctx.globalAlpha = 0.5;
    this.ctx.beginPath();
    this.ctx.rect(0, this.canvas.height - this.minimapSize, this.minimapSize, this.canvas.height);
    this.ctx.fill();
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    var players = gamestate.players;
    players.forEach(function (player) {
        player.units.forEach(function(unit) {
            var newPos = new Object(unit.pos);
            this.three2minimap(newPos, gamestate.terrain);
            this.renderMinimapUnit(newPos, player.color);
        }.bind(this));
        player.selectedUnits.forEach(function(selected_unit) {
            var newPos = new Object(selected_unit.pos);
            this.three2minimap(newPos, gamestate.terrain);
            this.renderMinimapSelectedHighlight(newPos);
        }.bind(this));
    }.bind(this));

    gamestate.obstacles.nodes.forEach(function (startNode) {
        startNode.connections.forEach(function (endNode) {
            var newStart = startNode.pos.clone();
            var newEnd = endNode.pos.clone();
            this.three2minimap(newStart, gamestate.terrain);
            this.three2minimap(newEnd, gamestate.terrain);
            this.renderMinimapNodeConnection(newStart, newEnd);
        }.bind(this));
    }.bind(this));
};

UIRenderer.prototype.renderMinimapUnit = function(position, color) {
    this.ctx.globalAlpha = 1;
    this.fillMinimapCircle(position, 2, color);
};

UIRenderer.prototype.renderMinimapSelectedHighlight = function(position) {
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = "00FF00";
    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, 2, 0, Math.PI * 2, true);
    this.ctx.stroke();
};

UIRenderer.prototype.fillMinimapCircle = function(position, radius, color) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, radius, 0, Math.PI * 2, true);
    this.ctx.fill();
};

UIRenderer.prototype.renderMinimapNodeConnection = function(start, end) {
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = 1;
    this.ctx.strokeStyle = "green";
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();
};

// Transform the given vector from a point in the terrain of size terrainSize
// to a point on this renderer's minimap.
UIRenderer.prototype.three2minimap = function(vector, terrainSize) {
    // vector.x = (vector.x + terrainSize.width / 2) / terrainSize.width;
    // vector.y = (vector.y + terrainSize.height / 2) / terrainSize.height;
    vector.x = (vector.x) / terrainSize.width;
    vector.y = (vector.y) / terrainSize.height;
    vector.y = 1 - vector.y;
    vector.x = vector.x * this.minimapSize;
    vector.y = vector.y * this.minimapSize;
    vector.y = vector.y + this.canvas.height - this.minimapSize;
};

// Feed in 3D coordinates of the viewport edges in the world 
// (any quadrilateral as long as they are in order).
UIRenderer.prototype.renderViewPort = function(d1, d2, d3, d4, terrainSize) {
    // Draw the map background
    this.ctx.strokeStyle = "#FFFFFF";
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = 1;
    this.ctx.beginPath();

    this.three2minimap(d1, terrainSize);
    this.three2minimap(d2, terrainSize);
    this.three2minimap(d3, terrainSize);
    this.three2minimap(d4, terrainSize);

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
        var oldCoords = this.coords[1]; //left mouse button clicked location
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
    this.canvas.height = window.innerHeight - 41;//41 is 1 + (the height of the navbar at the top)
};

UIRenderer.prototype.startRendering = function(renderMethod) {
    var boundRender = function() {
        this.clear();
        renderMethod();
        requestAnimationFrame(boundRender);
    }.bind(this);
    boundRender();
};
