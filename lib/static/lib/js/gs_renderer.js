function GSRenderer() {
    this.container = $("#canvas-container");
    this.width = this.container.width();
    this.height = this.container.height();

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
    this.g_material = new THREE.MeshLambertMaterial( { color: 0x00FF00 } );
    this.cone_geometry = new THREE.CylinderGeometry(0, 15, 50, 15, 15, false);

    this.renderer = new THREE.WebGLRenderer( { antialias: true, clearColor: 0x050505, clearAlpha: 1 } );
    this.renderer.setSize(this.width, this.height);
    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.zIndex = 0;
    this.renderer.shadowMapEnabled = true;
    this.renderer.shadowMapSoft = true;

    $("#canvas-container").append(this.renderer.domElement);
}

GSRenderer.prototype.makeObstacle = function(obstacles) {
    console.log("Obstacle code does not exist");
    // Insert code here
    return {};
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

GSRenderer.prototype.makeBullet = function(unit) {
    var material = this.g_material;
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

GSRenderer.prototype.removeMesh = function(mesh) {
    this.scene.remove(mesh);
};

GSRenderer.prototype.updatePosAndFacing = function(mesh, obj) {
    mesh.position.set(obj.pos.x - 400, -obj.pos.y + 400, 10);
    mesh.rotation.z = -Math.PI/2 - obj.facing;
};

GSRenderer.prototype.updateUnit = function(mesh, unit) {
    // Ideally there would also be some rendering for unit animations here too
    this.updatePosAndFacing(mesh, unit);
};

GSRenderer.prototype.updateBullet = function(mesh, bullet) {
    // Ideally there would also be soome rendering for bullet animations here too
    this.updatePosAndFacing(mesh, bullet);
};

GSRenderer.prototype.preload = function(gamestate) {
    this.map = {
        players: [],
        objects: []
    };
    gamestate.players.forEach(function(player, pid) {
        this.map.players[pid] = {
            units: [],
            bullets: []
        };
        player.units.forEach(function(unit, uid) {
            this.map.players[pid].units[uid] = this.makeUnit(unit, player.color);
        }.bind(this));
    }.bind(this));
};

GSRenderer.prototype.update = function(gamestate) {
    gamestate.players.forEach(function(player, pid) {
        var bullets = [];
        var rendrrUnits = this.map.players[pid].units;
        var rendrrBullets = this.map.players[pid].bullets;
        while (rendrrUnits.length > player.units.length) {
            removed = rendrrUnits.pop();
            this.removeMesh(removed.mesh);
        }
        while (rendrrUnits.length < player.units.length) {
            added = this.makeUnit(player.units[rendrrUnits.length], player.color);
            rendrrUnits.push(added);
        }

        player.units.forEach(function(unit, uid) {
            bullets = bullets.concat(unit.bullets);
            this.updateUnit(rendrrUnits[uid].mesh, unit);
        }.bind(this));

        while (rendrrBullets.length > bullets.length) {
            removed = rendrrBullets.pop();
            this.removeMesh(removed.mesh);
        }
        while (rendrrBullets.length < bullets.length) {
            added = this.makeBullet(bullets[rendrrBullets.length]);
            rendrrBullets.push(added);
        }
        bullets.forEach(function(bullet, bid) {
            this.updateBullet(rendrrBullets[bid].mesh, bullet);
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
