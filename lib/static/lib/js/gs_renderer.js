function GSRenderer() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(
        45,
        this.width / this.height,
        1,
        10000
    );
    this.camera.position.z = 1000;

    this.scene = new THREE.Scene();

    //for ( var i = 0; i < this.plane.faceVertexUvs[0].length; i++ ) {
    //    uvs = this.plane.faceVertexUvs[0][i];
    //    for ( var j = 0; j < uvs.length; j++ ) {
    //        uvs[j].u *= 8;
    //        uvs[j].v *= 8;
    //    }
    //}

    this.plane = new THREE.Mesh(
        new THREE.PlaneGeometry( this.width, this.height, 20, 20 ),
        new THREE.MeshLambertMaterial( { color: 0x99FF99 } )
    );
    //this.plane.rotation.x = -Math.PI / 2;
    this.plane.castShadow = false;
    this.plane.receiveShadow = true;

    this.scene.add( this.plane );

    //var ambientLight = new THREE.AmbientLight( 0x606060 );
    //this.scene.add( ambientLight );

    var spotLight = new THREE.SpotLight( 0xffffff, 1 );
    spotLight.position.set( 0, 0, 1000 );
    spotLight.target.position.set(0, 0, 0);
    spotLight.castShadow = true;
    spotLight.shadowMapWidth = 1024;
    spotLight.shadowMapHeight = 1024;
    spotLight.shadowCameraNear = 500;
    spotLight.shadowCameraFar = 4000;
    spotLight.shadowCameraFov = 30;
    spotLight.shadowDarkness = 1;
    this.scene.add( spotLight );

    this.r_material = new THREE.MeshLambertMaterial( { color: 0xFF0000 } );
    this.b_material = new THREE.MeshLambertMaterial( { color: 0x0000FF } );
    this.cone_geometry = new THREE.CylinderGeometry(0, 15, 50, 15, 15, false);

    this.renderer = new THREE.WebGLRenderer( { antialias: true, clearColor: 0x050505, clearAlpha: 1 } );
    this.renderer.setSize(this.width, this.height);
    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.zIndex = 0;
    this.renderer.shadowMapEnabled = true;
    this.renderer.shadowMapSoft = true;

    $("#canvas-container").append(this.renderer.domElement);
    $(window).resize($.proxy(this.resize, this));
}

GSRenderer.prototype.resize = function() {
    // notify the renderer of the size change
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    // update the camera
    this.camera.aspect   = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
};

GSRenderer.prototype.makeUnit = function(unit, color) {
    var material = this.r_material;
    if (color == 'rgb(0, 0, 255)') {
        material = this.b_material;
    }
    var mesh = new THREE.Mesh(this.cone_geometry, material);
    mesh.overdraw = true;
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    this.updateUnit(mesh, unit);
    this.scene.add(mesh);
    return {
        mesh: mesh
    };
};

GSRenderer.prototype.updateUnit = function(mesh, unit) {
    mesh.position.set(unit.pos.x - 400, -unit.pos.y + 400, 10);
    mesh.rotation.z = -Math.PI/2 - unit.facing;
};

GSRenderer.prototype.preload = function(gamestate) {
    this.map = {
        players: [],
        objects: []
    };
    gamestate.players.forEach(function(player, pid) {
        this.map.players[pid] = {
            units: []
        };
        player.units.forEach(function(unit, uid) {
            this.map.players[pid].units[uid] = this.makeUnit(unit, player.color);
        }.bind(this));
    }.bind(this));
};

GSRenderer.prototype.update = function(gamestate) {
    gamestate.players.forEach(function(player, pid) {
        player.units.forEach(function(unit, uid) {
            this.updateUnit(this.map.players[pid].units[uid].mesh, unit);
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
