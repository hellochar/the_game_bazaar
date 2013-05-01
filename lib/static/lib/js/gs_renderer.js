// Currently GSRState is a hack to augment the gamestate snapshot with GameState meshes
function GSRState(t0_gamestate, renderer) {
    this.players = [];
    this.obstacles = [];
    this.terrain = [];
    this.renderer = renderer;

    this.terrain = renderer.makeTerrain(t0_gamestate.terrain);

    // DEBUG
    console.log(t0_gamestate);
    // DEBUG

    t0_gamestate.players.forEach(function(player, pid) {
        this.players[pid] = {
            units: [],
            bullets: []
        };
        // Augment unit with mesh
        player.units.forEach(function(unit, uid) {
            this.players[pid].units[uid] = renderer.makeUnit(player.color);
        }.bind(this));
    }.bind(this));

    // Another hack to convert (startNode, endNode) representation
    // To actual mesh.
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

// MUST CALL GSRenderer's intialize method before starting renderer
function GSRenderer() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Set up the perspective camera
    this.camera = new THREE.PerspectiveCamera(
        45, // 45 degree field of view
        this.width / this.height, // Aspect ratio
        1, // near plane
        20000 // far plane
    );

    // The view angle is (-cameraBack/cameraHeight)
    this.cameraBack = 500;
    this.cameraHeight = 1000;

    // Set the camera position to be by default centered
    this.camera.position.x = 0;
    this.camera.position.y = 0 - this.cameraBack;
    this.camera.position.z = this.cameraHeight;


    // Create the scene
    this.scene = new THREE.Scene();

    // Target position is by default (0, 0, 0)
    // Can be changed if necessary, ie. when target starts out at player start location
    this.target = new THREE.Vector3(0, 0, 0);

    // Add an ambient light to the scene
    var ambientLight = new THREE.AmbientLight( 0x606060 );
    this.scene.add( ambientLight );

    // Add a spotlight above the scene
    var spotLight = new THREE.SpotLight( 0xffffff, 0.8 );
    spotLight.position.set( 0, 0, 10000 );
    spotLight.target.position.set(0, 0, 0);
    spotLight.castShadow = true;
    spotLight.shadowMapWidth = 2024;
    spotLight.shadowMapHeight = 2024;
    spotLight.shadowCameraNear = 500;
    spotLight.shadowCameraFar = this.camera.far;
    spotLight.shadowCameraFov = 30;
    spotLight.shadowDarkness = 1;
    this.scene.add( spotLight );

    // Don't know why we insist on using RGB values as opposed to hex
    var color = function(r, g, b) {
        return new THREE.Color().setRGB(r/255, g/255, b/255);
    };

    // Predefined materials that can be used in the renderer (for convenience)
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

    // Load terrain texture
    this.terrainTexture = THREE.ImageUtils.loadTexture('/static/game/assets/terrain.jpg');
    this.terrainTexture.wrapS = this.terrainTexture.wrapT = THREE.RepeatWrapping;
    this.terrainTexture.repeat.set(20, 20);

    // OBJ loader for .obj files
    var objLoader = new THREE.OBJLoader();

    // Load the biplane (default unit biplane)
    objLoader.load( '/static/game/assets/Biplane.obj', function( object ) {
        console.log("Done loading obj!");
        object.traverse( function ( child ) {
            if ( child instanceof THREE.Mesh ) {
                if (!this.bp_geometry) {
                    this.bp_geometry = child.geometry;
                } else {
                    // In case there are multiple meshes that make up this object
                    // Merge their geometries to speed up rendering time
                    THREE.GeometryUtils.merge(this.bp_geometry, child);
                }
            }
        }.bind(this) );
    }.bind(this) );

    // Load the cone geometry (default unit cone)
    this.cone_geometry = new THREE.CylinderGeometry(0, 1, 2, 15, 15, false);

    // Projector for transforming from 2D to 3D points
    this.projector = new THREE.Projector();

    // Set renderer
    this.renderer = new THREE.WebGLRenderer( { antialias: true, clearColor: 0xB2C4FF, clearAlpha: 1 } );
    this.renderer.setSize(this.width, this.height);
    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.zIndex = 0;
    this.renderer.shadowMapEnabled = true;
    this.renderer.shadowMapSoft = true;

    // Initialize the GSR state to undefined
    // MUST INITIALIZE BEFORE USING RENDERER
    this.state = undefined;

    $("#canvas-container").append(this.renderer.domElement);
    $(window).resize($.proxy(this.resize, this));
}

// Initialize the 3D renderer with an initial map state
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

// The viewport position is the 3D location of the focused scene
GSRenderer.prototype.getTarget = function() {
    return this.target;
};

// Set the position of the focused scene
GSRenderer.prototype.setTarget = function(x, y) {
    this.target.x = x;
    this.target.y = y;

    // Move the camera exactly to above and units in the negative y direction of the target
    this.camera.position.x = x;
    this.camera.position.y = y - this.cameraBack;

    // Now that the camera has moved, ensure that it is looking at
    // the target and that it is properly rotated
    this.camera.lookAt(this.target);
    this.camera.rotation.z = 0;
};

// Project canvas coords to 3D world coords
GSRenderer.prototype.project = function(pt) {
    var vector = new THREE.Vector3( ( pt.x / this.width ) * 2 - 1, - ( pt.y / this.height ) * 2 + 1, 0.5 );
    this.projector.unprojectVector( vector, this.camera );
    var dir = vector.sub( this.camera.position ).normalize();
    var ray = new THREE.Raycaster( this.camera.position, dir );
    var distance = - this.camera.position.z / dir.z;
    var pos = this.camera.position.clone().add( dir.multiplyScalar( distance ) );
    // Floor position to make coordinates look cleaner
    pos.x = Math.floor(pos.x);
    pos.y = Math.floor(pos.y);
    pos.z = Math.floor(pos.z);
    return pos;
};

// Create ONCE the terrain for the map
GSRenderer.prototype.makeTerrain = function(terrain) {
    // Create a plane with a double-sided material with the terrain texture and lambert shading
    // This terrain has 20 x 20 repeating terrain by default
    var plane = new THREE.Mesh(
        new THREE.PlaneGeometry( terrain.size, terrain.size, 20, 20 ),
        new THREE.MeshLambertMaterial( { map: this.terrainTexture, side: THREE.DoubleSide } )
    );
    //this.plane.rotation.x = -Math.PI / 2;
    plane.castShadow = false;
    plane.receiveShadow = true;
    this.scene.add(plane);
    return plane;
};

// Create ONCE the obstacles for the map
GSRenderer.prototype.makeObstacle = function(startNode, endNode) {
    // Draw a plane geometry by hand to directly add the obstacle without
    // complicated math involving duplicate obstacle geometries
    // I can't figure out how to make walls with thickness that doesn't
    // run into the problem with duplicate geometries
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
    //mesh.position.z = 20;
    this.scene.add(mesh);
    return mesh;
};

// Create ONCE the units for the map
// By default this unit should have a bounding sphere of radius ~1
GSRenderer.prototype.makeUnit = function(color) {
    // By default, the unit is a cone
    var geometry = this.cone_geometry;

    // If the Biplane has been loaded, use that geometry instead
    if (this.bp_geometry) {
        geometry = this.bp_geometry;
    }

    // Create the mesh
    var mesh = new THREE.Mesh(geometry, this.color_material[color]);
    mesh.overdraw = true;
    mesh.castShadow = true;
    mesh.receiveShadow = false;

    // Draw the selection ring
    var ring_geometry = new THREE.TorusGeometry( 1, 0.2, 2, 20 );
    var ring_material = new THREE.MeshBasicMaterial( { color: 0x00FF00, opacity: 0.7, transparent: true });
    mesh.select_ring = new THREE.Mesh(ring_geometry, ring_material);
    mesh.selected = false;
    this.scene.add(mesh);
    return mesh;
};

// Create ONCE the bullets for the map
// By default this unit should have a bounding sphere of radius ~1
GSRenderer.prototype.makeBullet = function() {
    // By default the unit is a cone
    var mesh = new THREE.Mesh(this.cone_geometry, this.color_material['rgb(0, 255, 0)']);
    mesh.scale.set(15, 15, 15);
    console.log(mesh);
    mesh.overdraw = true;
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    this.scene.add(mesh);
    return mesh;
};

// Generic method that can remove any mesh from the scene
GSRenderer.prototype.removeMesh = function(mesh) {
    this.scene.remove(mesh);
};

// This updates the position and facing of the mesh based on the object
GSRenderer.prototype.updatePosAndFacing = function(mesh, obj) {
    // Set the x,y position to the obj position, but also
    // set the z coordinate of the object to above 50 to make
    // it visible above the plane.
    mesh.position.set(obj.pos.x, obj.pos.y, 50);
    // There is a disconnect between facing defined in the gamestate
    // and facing defined in gamestate coordinates, so this is
    // a little hack to make them work together
    mesh.rotation.z = - Math.PI / 2 + obj.facing;
};

// This updates the unit mesh's attributes according to the unit state
GSRenderer.prototype.updateUnit = function(mesh, unit, showSelection) {
    // Ideally there would also be some rendering for unit animations here too
    this.updatePosAndFacing(mesh, unit);
    // Correct the scale of the unit
    mesh.scale.x = mesh.scale.y = mesh.scale.z = unit.size;
    // Look's at the unit's selection state in order to display
    // it's selection ring
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

// This updates the bullet mesh's attributes according to the bullet state
GSRenderer.prototype.updateBullet = function(mesh, bullet) {
    // Ideally there would also be some rendering for bullet animations here too
    this.updatePosAndFacing(mesh, bullet);
};

// This updates the scene's objects according to the gamestate
GSRenderer.prototype.update = function(gamestate) {
    // Update the state size to prevent excess or insufficient array entries
    this.state.updateStateSize(gamestate);

    // For each gamestate player
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

// Render frame method for the GSRenderer
GSRenderer.prototype.animate = function() {
    //this.mesh.rotation.x += 0.01;
    //this.mesh.rotation.y += 0.02;
    this.renderer.render(this.scene, this.camera);
};
