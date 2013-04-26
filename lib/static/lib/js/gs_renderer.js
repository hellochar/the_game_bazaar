function GSRState(t0_gamestate, renderer) {
    this.players = [];
    this.obstacles = [];
    this.terrain = [];
    this.renderer = renderer;

    this.terrain = renderer.makeTerrain(t0_gamestate.terrain);

    console.log(t0_gamestate);
    t0_gamestate.players.forEach(function(player, pid) {
        this.players[pid] = {
            units: [],
            bullets: []
        };
        player.units.forEach(function(unit, uid) {
            this.players[pid].units[uid] = renderer.makeUnit(player.color);
        }.bind(this));
    }.bind(this));

    t0_gamestate.obstacles.nodes.forEach(function(startNode) {
        startNode.connections.forEach(function(endNode) {
            this.obstacles.push(renderer.makeObstacle(startNode, endNode));
        }.bind(this));
    }.bind(this));
}

// Updates the size of renderer state based on the new snapshot
GSRState.prototype.updateStateSize = function(gamestate) {
    gamestate.players.forEach(function(player, pid) {
        // Correct the number of units in the renderer state
        var rendererUnits = this.players[pid].units;
        while (rendererUnits.length > player.units.length) {
            removed = rendererUnits.pop();
            this.renderer.removeMesh(removed);
        }
        while (rendererUnits.length < player.units.length) {
            added = this.renderer.makeUnit(player.color);
            rendererUnits.push(added);
        }
        // Load bullets outside of each unit to prevent
        // massive amounts of updating needed to correct
        // the number of bullets
        var num_bullets = 0;
        player.units.forEach(function(unit, uid) {
            num_bullets += unit.bullets.length;
        });
        // Correct the number of bullets in the renderer state
        var rendererBullets = this.players[pid].bullets;
        while (rendererBullets.length > num_bullets) {
            removed = rendererBullets.pop();
            this.renderer.removeMesh(removed);
        }
        while (rendererBullets.length < num_bullets) {
            added = this.renderer.makeBullet();
            rendererBullets.push(added);
        }
    }.bind(this));
};

function GSRenderer() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(
        45,
        this.width / this.height,
        1,
        20000
    );
    this.camera.position.z = 1000;
    this.camera.position.y = -700;

    this.scene = new THREE.Scene();

    var ambientLight = new THREE.AmbientLight( 0x606060 );
    this.scene.add( ambientLight );

    var spotLight = new THREE.SpotLight( 0xffffff, 0.8 );
    spotLight.position.set( 0, 0, 10000 );
    spotLight.target.position.set(0, 0, 0);
    spotLight.castShadow = true;
    spotLight.shadowMapWidth = 1024;
    spotLight.shadowMapHeight = 1024;
    spotLight.shadowCameraNear = 500;
    spotLight.shadowCameraFar = 4000;
    spotLight.shadowCameraFov = 30;
    spotLight.shadowDarkness = 1;
    this.scene.add( spotLight );

    // Don't know why we insist on using RGB values as opposed to hex
    var color = function(r, g, b) {
        return new THREE.Color().setRGB(r/255, g/255, b/255);
    };

    this.color_material = {
        'rgb(255, 0, 0)': new THREE.MeshLambertMaterial( { color: color(255, 0, 0) } ),
        'rgb(0, 0, 255)': new THREE.MeshLambertMaterial( { color: color(0, 0, 255) } ),
        'rgb(0, 128, 0)': new THREE.MeshLambertMaterial( { color: color(0, 128, 0) } ),
        'rgb(0, 255, 255)': new THREE.MeshLambertMaterial( { color: color(0, 255, 255) } ),
        'rgb(255, 0, 255)': new THREE.MeshLambertMaterial( { color: color(255, 0, 255) } ),
        'rgb(255, 255, 0)': new THREE.MeshLambertMaterial( { color: color(255, 255, 0) } ),
        'rgb(255, 128, 0)': new THREE.MeshLambertMaterial( { color: color(255, 128, 0) } ),
        'rgb(0, 128, 255)': new THREE.MeshLambertMaterial( { color: color(0, 128, 255) } ),
        'rgb(128, 0, 255)': new THREE.MeshLambertMaterial( { color: color(128, 0, 255) } ),
        'rgb(0, 255, 0)': new THREE.MeshLambertMaterial( { color: color(0, 255, 0) } )
    };

    this.cone_geometry = new THREE.CylinderGeometry(0, 15, 50, 15, 15, false);

    this.projector = new THREE.Projector();

    this.renderer = new THREE.WebGLRenderer( { antialias: true, clearColor: 0xB2C4FF, clearAlpha: 1 } );
    this.renderer.setSize(this.width, this.height);
    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.zIndex = 0;
    this.renderer.shadowMapEnabled = true;
    this.renderer.shadowMapSoft = true;

    this.state = undefined;

    $("#canvas-container").append(this.renderer.domElement);
    $(window).resize($.proxy(this.resize, this));
}

GSRenderer.prototype.initialize = function(gamestate) {
    this.state = new GSRState(gamestate, this);
};

GSRenderer.prototype.resize = function() {
    // notify the renderer of the size change
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    // update the camera
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
};

GSRenderer.prototype.getViewport = function() {
    return this.scene.position;
};

GSRenderer.prototype.setViewport = function(x, y) {
    this.camera.position.x = x;
    this.camera.position.y = y - 700;
    this.scene.position.x = x;
    this.scene.position.y = y;
};

// Project canvas coords to 3D world coords
GSRenderer.prototype.project = function(pt) {
    var vector = new THREE.Vector3( ( pt.x / window.innerWidth ) * 2 - 1, - ( pt.y / window.innerHeight ) * 2 + 1, 0.5 );
    this.projector.unprojectVector( vector, this.camera );
    var dir = vector.sub( this.camera.position ).normalize();
    var ray = new THREE.Raycaster( this.camera.position, dir );
    var distance = - this.camera.position.z / dir.z;
    var pos = this.camera.position.clone().add( dir.multiplyScalar( distance ) );
    pos.x = Math.floor(pos.x);
    pos.y = Math.floor(pos.y);
    pos.z = Math.floor(pos.z);
    return pos;
};

GSRenderer.prototype.makeTerrain = function(terrain) {
    //for ( var i = 0; i < this.plane.faceVertexUvs[0].length; i++ ) {
    //    uvs = this.plane.faceVertexUvs[0][i];
    //    for ( var j = 0; j < uvs.length; j++ ) {
    //        uvs[j].u *= 8;
    //        uvs[j].v *= 8;
    //    }
    //}

    var plane = new THREE.Mesh(
        new THREE.PlaneGeometry( terrain.size, terrain.size, 20, 20 ),
        new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true } )
    );
    //this.plane.rotation.x = -Math.PI / 2;
    plane.castShadow = false;
    plane.receiveShadow = true;
    this.scene.add(plane);
    return plane;
};

GSRenderer.prototype.makeObstacle = function(startNode, endNode) {
    var geometry = new THREE.Geometry();
    geometry.vertices.push(startNode.pos);
    geometry.vertices.push(endNode.pos);
    geometry.vertices.push(endNode.pos.clone().add(new THREE.Vector3(0, 0, 100)));
    geometry.vertices.push(startNode.pos.clone().add(new THREE.Vector3(0, 0, 100)));
    geometry.faces.push(new THREE.Face4(0, 1, 2, 3));
    var material = new THREE.MeshLambertMaterial( { color: 0x8000FF , side: THREE.DoubleSide } );
    var mesh = new THREE.Mesh(geometry, material);

    //mesh.overdraw = true;
    //mesh.castShadow = true;
    //mesh.receiveShadow = false;
    mesh.position.z = 20;
    this.scene.add(mesh);
    return mesh;
};

GSRenderer.prototype.makeUnit = function(color) {
    var mesh = new THREE.Mesh(this.cone_geometry, this.color_material[color]);
    mesh.overdraw = true;
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    var ring_geometry = new THREE.TorusGeometry( 20, 5, 2, 20 );
    var ring_material = new THREE.MeshBasicMaterial( { color: 0x00FF00, opacity: 0.7, transparent: true });
    mesh.select_ring = new THREE.Mesh(ring_geometry, ring_material);
    mesh.selected = false;
    this.scene.add(mesh);
    return mesh;
};

GSRenderer.prototype.makeBullet = function() {
    var mesh = new THREE.Mesh(this.cone_geometry, this.color_material['rgb(0, 255, 0)']);
    mesh.overdraw = true;
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    this.scene.add(mesh);
    return mesh;
};

GSRenderer.prototype.removeMesh = function(mesh) {
    this.scene.remove(mesh);
};

GSRenderer.prototype.updatePosAndFacing = function(mesh, obj) {
    mesh.position.set(obj.pos.x, obj.pos.y, 10);
    mesh.rotation.z = - Math.PI / 2 + obj.facing;
};

GSRenderer.prototype.updateUnit = function(mesh, unit, showSelection) {
    // Ideally there would also be some rendering for unit animations here too
    this.updatePosAndFacing(mesh, unit);

    if(showSelection === true) {
        if (mesh.selected != unit.selected) {
            mesh.selected = unit.selected;
            if (unit.selected) {
                mesh.add(mesh.select_ring);
            } else {
                mesh.remove(mesh.select_ring);
            }
        }
    }
};

GSRenderer.prototype.updateBullet = function(mesh, bullet) {
    // Ideally there would also be some rendering for bullet animations here too
    this.updatePosAndFacing(mesh, bullet);
};

GSRenderer.prototype.update = function(gamestate) {
    // Update the state size
    this.state.updateStateSize(gamestate);

    gamestate.players.forEach(function(player, pid) {
        var playerUnits = this.state.players[pid].units;
        var playerBullets = this.state.players[pid].bullets;
        // Update each unit for the player, and gather a list of all bullets
        // for this user
        var bullets = [];
        player.units.forEach(function(unit, uid) {
            bullets = bullets.concat(unit.bullets);
            this.updateUnit(playerUnits[uid], unit, pid === window.game.player_id);
        }.bind(this));
        // Update each bullet
        bullets.forEach(function(bullet, bid) {
            this.updateBullet(playerBullets[bid], bullet);
        }.bind(this));
    }.bind(this));
};

GSRenderer.prototype.animate = function() {
    //this.mesh.rotation.x += 0.01;
    //this.mesh.rotation.y += 0.02;
    this.camera.lookAt(this.scene.position);
    this.camera.rotation.z = 0;
    this.renderer.render(this.scene, this.camera);
};
