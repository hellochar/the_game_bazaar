function AssetLoader() {
    this.cone_geometry = new THREE.CylinderGeometry(0, 1, 2, 15, 15, false);
}

AssetLoader.prototype.loadBiplane = function(loadedCB) {
    var objLoader = new THREE.OBJLoader();

    this.allLoaded = false;
    // When it finally finishes loading the event handler will be called
    objLoader.load( '/static/game/assets/Biplane.obj', function(object) {
        this.biplane = this.processObject3d(object);
        loadedCB();
    }.bind(this));
}

// Process Object3D files into a geometry
AssetLoader.prototype.processObject3d = function(object) {
    console.log("Done loading obj!");
    var geometry;
    object.traverse( function ( child ) {
        if ( child instanceof THREE.Mesh ) {
            if (!geometry) {
                geometry = child.geometry;
            } else {
                // In case there are multiple meshes that make up this object
                // Merge their geometries to speed up rendering time
                THREE.GeometryUtils.merge(geometry, child);
            }
        }
    });
    return geometry;
}
