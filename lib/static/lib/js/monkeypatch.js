THREE.Vector3.prototype.toJSON = function() {
    return {'x': this.x, 'y': this.y, 'z': this.z};
}

THREE.Vector3.fromJSON = function(json) {
    return new THREE.Vector3(json.x, json.y, json.z);
}
