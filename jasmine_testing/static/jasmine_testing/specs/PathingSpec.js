describe("Pathing", function() {
    describe("segmentsIntersect works", function() {
        // The cases are:
        // starting at the same place
        // ending at the same place
        // starting and ending at the same place
        // not intersecting
        // intersecting
    });
    describe("inRange works", function() {
        // The cases are:
        // In range normal order
        // Out of range normal order
        // In range inverse order
        // Out of range inverse order
    });
    describe("canGo works", function() {
        // The cases are:
        // A segment blocking the way
        // No segment blocking the way
        // Start not in correct domain
        // Dest not in correct domain
    });
    describe("getAngle works", function() {
        // The cases are:
        // First quadrant
        // Second quadrant
        // Third quadrant
        // Fourth quadrant
    });
    describe("setPathNodeDomain works", function() {
        // The cases are:
        // The node has only one connection
        // The node has two connections
        // The node has more than two connections
        // The node's domain goes from the second quadrant to the third quadrant.
        // the above case is important because that is when we jump from Math.PI to -Math.PI
    });
    describe("getPathGraph works", function() {
        // Just one basic test with four nodes and the start and destination
    });
    describe("expandNode works", function() {
        // Just one basic test that expands a node with four connections
        // and then another node with three connections
    });
    describe("getPath works", function() {
        // Just one basic test that walks through a map of four nodes.
    });
});