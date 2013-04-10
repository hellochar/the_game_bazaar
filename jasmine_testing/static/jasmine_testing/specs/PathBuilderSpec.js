describe("Path Builder", function() {
    var pathbuilder;
    beforeEach(function() {
        pathbuilder = new PathBuilder();
        var startpos1 = new THREE.Vector3(0, 0, 0);
        var endpos1 = new THREE.Vector3(0, 10, 0);
        var tempPath1 = new LinearPath(startpos1, endpos1, 1, 0);
        pathbuilder.addPath(tempPath1);
        var startpos2 = new THREE.Vector3(0, 10, 0);
        var endpos2 = new THREE.Vector3(10, 10, 0);
        var tempPath2 = new LinearPath(startpos2, endpos2, 1, 10);
        pathbuilder.addPath(tempPath2);
    });

    it("add paths correctly", function() {
        expect(pathbuilder.paths.length).toBe(2);
    });

    it("gets position correctly", function() {
        expect(pathbuilder.getPos(5)).toEqual(new THREE.Vector3(0, 5, 0));
        expect(pathbuilder.getPos(15)).toEqual(new THREE.Vector3(5, 10, 0));
    });

    it("gets facing correctly", function() {
        expect(pathbuilder.getFacing(5)).toBeCloseTo(Math.PI / 2, 2);
        expect(pathbuilder.getFacing(15)).toBeCloseTo(0, 2);
    });
});
