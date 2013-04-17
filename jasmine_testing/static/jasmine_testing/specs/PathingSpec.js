describe("Pathing", function() {
    describe("segmentsIntersect", function() {
        // The cases are:
        // starting at the same place
        it("handles two segments starting at the same place", function() {
            var val = segmentsIntersect(
                new THREE.Vector3(20, 25),
                new THREE.Vector3(15, 15),
                new THREE.Vector3(20, 25),
                new THREE.Vector3(40, 40)
            );
            expect(val.onLine1 && val.onLine2).toBe(false);
        });
        // ending at the same place
        it("handles two segments ending at the same place", function() {
            var val = segmentsIntersect(
                new THREE.Vector3(15, -15),
                new THREE.Vector3(20, 25),
                new THREE.Vector3(-40, -40),
                new THREE.Vector3(20, 25)
            );
            expect(val.onLine1 && val.onLine2).toBe(false);
        });
        // starting and ending at the same place
        it("handles two segments ending at the same place", function() {
            var val = segmentsIntersect(
                new THREE.Vector3(15, -15),
                new THREE.Vector3(20, 25),
                new THREE.Vector3(15, -15),
                new THREE.Vector3(20, 25)
            );
            expect(val.onLine1 && val.onLine2).toBe(false);
        });
        // not intersecting
        it("handles two segments not intersecting", function() {
            var val = segmentsIntersect(
                new THREE.Vector3(15, -15),
                new THREE.Vector3(20, 25),
                new THREE.Vector3(0, 20),
                new THREE.Vector3(15, 19)
            );
            expect(val.onLine1 && val.onLine2).toBe(false);
        });
        // intersecting
        it("handles two segments ending at the same place", function() {
            var val = segmentsIntersect(
                new THREE.Vector3(15, -15),
                new THREE.Vector3(20, 25),
                new THREE.Vector3(0, 20),
                new THREE.Vector3(25, 19)
            );
            expect(val.onLine1 && val.onLine2).toBe(true);
        });
        // check simple intersection pt
        it("handles a simple intersection pt", function() {
            var val = segmentsIntersect(
                new THREE.Vector3(15, 0),
                new THREE.Vector3(-15, 0),
                new THREE.Vector3(0, 20),
                new THREE.Vector3(0, -20)
            );
            expect(val.intersectionPt.x).toBeCloseTo(0, 2);
            expect(val.intersectionPt.y).toBeCloseTo(0, 2);
        });
    });
    describe("inRange", function() {
        // The cases are:
        // In range normal order
        it("handles an angle in the range in normal order", function() {
            var val = inRange(1, [0, 2]);
            expect(val).toBe(true);
        });
        // Out of range normal order
        it("handles an angle out of the range in normal order", function() {
            var val = inRange(3, [0, 2]);
            expect(val).toBe(false);
        });
        // In range inverse order
        it("handles an angle in the range in inverse order", function() {
            var val = inRange(3, [2, -2]);
            expect(val).toBe(true);
        });
        // Out of range inverse order
        it("handles an angle in the range in inverse order", function() {
            var val = inRange(0, [2, -2]);
            expect(val).toBe(false);
        });
    });
    describe("canGo", function() {
        var node_graph;
        var n1, n2, n3, n4, n5;
        beforeEach(function() {
            node_graph = new Graph();
            n1 = new Node(new THREE.Vector3(0, 0));
            n2 = new Node(new THREE.Vector3(15, 15));
            n3 = new Node(new THREE.Vector3(-15, 15));
            n4 = new Node(new THREE.Vector3(0, 25));
            n5 = new Node(new THREE.Vector3(-25, 0));
            node_graph.addNode(n1);
            node_graph.addNode(n2);
            node_graph.addNode(n3);
            node_graph.addNode(n4);
            node_graph.addNode(n5);

            // Set the connections
            n2.addConnection(n3);
            n3.addConnection(n5);
            // Instantiate the domains
            setPathNodeDomain(n2, n2);
            setPathNodeDomain(n3, n3);
            setPathNodeDomain(n5, n5);
            n1.domain = [-Math.PI, Math.PI];
            n4.domain = [-Math.PI, Math.PI];
        });
        // The cases are:
        // A segment blocking the way
        it("Handles a segment blocking the way", function() {
            var val = canGo(n1, n4, node_graph);
            expect(val).toBe(false);
        });
        // No segment blocking the way
        it("Handles no segment blocking the way", function() {
            var val = canGo(n1, n5, node_graph);
            expect(val).toBe(true);
        });
        // Start not in correct domain
        it("Handles the start not being in correct domain", function() {
            var val = canGo(n3, n1, node_graph);
            expect(val).toBe(false);
        });
        // Dest not in correct domain
        it("Handles the end not being in correct domain", function() {
            var val = canGo(n1, n3, node_graph);
            expect(val).toBe(false);
        });
    });
    describe("getAngle", function() {
        // The cases are:
        // First quadrant
        it("handles an angle in the first quadrant", function() {
            var val = getAngle(new THREE.Vector3(0, 0), new THREE.Vector3(15, 15));
            expect(val).toBeCloseTo(Math.PI / 4, 2);
        });
        // Second quadrant
        it("handles an angle in the second quadrant", function() {
            var val = getAngle(new THREE.Vector3(0, 0), new THREE.Vector3(-15, 15));
            expect(val).toBeCloseTo(3 * Math.PI / 4, 2);
        });
        // Third quadrant
        it("handles an angle in the third quadrant", function() {
            var val = getAngle(new THREE.Vector3(0, 0), new THREE.Vector3(-15, -15));
            expect(val).toBeCloseTo(-3 * Math.PI / 4, 2);
        });
        // Fourth quadrant
        it("handles an angle in the fourth quadrant", function() {
            var val = getAngle(new THREE.Vector3(0, 0), new THREE.Vector3(15, -15));
            expect(val).toBeCloseTo(-Math.PI / 4, 2);
        });
    });
    describe("setPathNodeDomain", function() {
        var node_graph;
        var n1, n2, n3, n4, n5;
        beforeEach(function() {
            node_graph = new Graph();
            n1 = new Node(new THREE.Vector3(0, 0));
            n2 = new Node(new THREE.Vector3(15, 15));
            n3 = new Node(new THREE.Vector3(-15, 15));
            n4 = new Node(new THREE.Vector3(0, 25));
            n5 = new Node(new THREE.Vector3(-25, 0));
            node_graph.addNode(n1);
            node_graph.addNode(n2);
            node_graph.addNode(n3);
            node_graph.addNode(n4);
            node_graph.addNode(n5);

            // Set the connections
            n2.addConnection(n3);
            n3.addConnection(n5);
            n4.addConnection(n5);
            n1.addConnection(n5);
        });
        // The cases are:
        // The node has only one connection
        it("handles nodes with only one connection", function() {
            setPathNodeDomain(n2, n2);
            expect(n2.domain).toEqual([-Math.PI, Math.PI]);
        });
        // The node has two connections
        it("handles nodes with two connections", function() {
            setPathNodeDomain(n3, n3);
            expect(n3.domain).toEqual([0, getAngle(n3.pos, n5.pos)]);
        });
        // The node has more than two connections
        it("handles nodes with more than two connections", function() {
            setPathNodeDomain(n5, n5);
            expect(n5.domain).toEqual([getAngle(n5.pos, n3.pos), getAngle(n5.pos, n1.pos)]);
        });
        // the above case is important because that is when we jump from Math.PI to -Math.PI
    });
    describe("getPathGraph", function() {
        var node_graph;
        var n1, n2, n3, startNode, endNode;
        beforeEach(function() {
            node_graph = new Graph();
            n1 = new Node(new THREE.Vector3(15, 15));
            n2 = new Node(new THREE.Vector3(-15, 15));
            n3 = new Node(new THREE.Vector3(-25, 0));
            node_graph.addNode(n1);
            node_graph.addNode(n2);
            node_graph.addNode(n3);

            // Set the connections
            n1.addConnection(n2);
            n2.addConnection(n3);

            // Set the start and end Nodes.
            startNode = new Node(new THREE.Vector3(0, 0));
            startNode.domain = [-Math.PI, Math.PI];
            endNode = new Node(new THREE.Vector3(0, 25));
            endNode.domain = [-Math.PI, Math.PI];
        });
        // Just one basic test with three nodes and the start and destination
        it("handles a basic test", function() {
            var path_graph = getPathGraph(startNode, endNode, node_graph);
            expect(startNode.connections.length).toBe(2);
            expect(path_graph.nodes[0].connections.length).toBe(3);
            expect(path_graph.nodes[1].connections.length).toBe(3);
            expect(path_graph.nodes[2].connections.length).toBe(2);
            expect(endNode.connections.length).toBe(0);
        });
    });
    describe("expandNode", function() {
        var node_graph;
        var path_graph;
        var n1, n2, n3, startNode, endNode;
        beforeEach(function() {
            node_graph = new Graph();
            n1 = new Node(new THREE.Vector3(15, 15));
            n2 = new Node(new THREE.Vector3(-15, 15));
            n3 = new Node(new THREE.Vector3(-25, 0));
            node_graph.addNode(n1);
            node_graph.addNode(n2);
            node_graph.addNode(n3);

            // Set the connections
            n1.addConnection(n2);
            n2.addConnection(n3);

            // Set the start and end Nodes.
            startNode = new Node(new THREE.Vector3(0, 0));
            startNode.domain = [-Math.PI, Math.PI];
            endNode = new Node(new THREE.Vector3(0, 25));
            endNode.domain = [-Math.PI, Math.PI];

            path_graph = getPathGraph(startNode, endNode, node_graph);
        });
        // Just one basic test that expands a node with two connections
        // and then another node with three connections
        it("handles two expansions in a row correctly", function() {
            var priority_q = new PriorityQueue();
            expandNode({node: startNode, path: []}, 0, priority_q);
            expect(priority_q.size()).toBe(2);
            priority_q.pop();
            expandNode({node: path_graph.nodes[0], path: []}, 10, priority_q);
            expect(priority_q.size()).toBe(4);
        });
    });
    describe("getPath", function() {
        var node_graph;
        var n1, n2, n3;
        beforeEach(function() {
            node_graph = new Graph();
            n1 = new Node(new THREE.Vector3(15, 15));
            n2 = new Node(new THREE.Vector3(-15, 15));
            n3 = new Node(new THREE.Vector3(-25, 0));
            node_graph.addNode(n1);
            node_graph.addNode(n2);
            node_graph.addNode(n3);

            // Set the connections
            n1.addConnection(n2);
            n2.addConnection(n3);
        });
        // Just one basic test that walks through a map of four nodes.
        it("handles a basic pathing test", function() {
            var path = getPath(new THREE.Vector3(), new THREE.Vector3(0, 25), node_graph);
            expect(path.map(function(item) { return item.pos; })).toEqual([n1.pos, new THREE.Vector3(0, 25)]);
        });
    });
});