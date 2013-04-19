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

    describe("Intersection", function() {
        var intersectingPath, nonIntersectingPath;
        beforeEach(function() {
            intersectingPath = new PathBuilder();
            var startpos1 = new THREE.Vector3(-10, 0, 0);
            var endpos1 = new THREE.Vector3(10, 10, 0);
            var tempPath1 = new LinearPath(startpos1, endpos1, 1, 0);
            intersectingPath.addPath(tempPath1);
            nonIntersectingPath = new PathBuilder();
            var startpos2 = new THREE.Vector3(0, 10, 0);
            var endpos2 = new THREE.Vector3(0, 20, 0);
            var tempPath2 = new LinearPath(startpos2, endpos2, 1, 0);
            nonIntersectingPath.addPath(tempPath2);
        });

        it("finds an intersection when it exists.", function() {
            expect(pathbuilder.intersects(intersectingPath, 2)).toBeTruthy();
        });

        it("doesn't find an intersection when it doesn't exist.", function() {
            expect(pathbuilder.intersects(nonIntersectingPath, 2)).toBe(false);
        });
    });
});
