describe("Graph Object", function() {
    it("Adds a node correctly", function() {
        var graph = new Graph();
        var node = new Node(new THREE.Vector3(1, 1));
        graph.addNode(node);
        expect(graph.nodes.length).toBe(1);
        expect(graph.nodes[0]).toBe(node);
    });

    it("Adds a connection correctly", function() {
        var n1 = new Node(new THREE.Vector3());
        var n2 = new Node(new THREE.Vector3(1, 1));
        n1.addConnection(n2);
        expect(n1.connections.length).toBe(1);
        expect(n2.connections.length).toBe(1);
        expect(n1.connections[0]).toBe(n2);
        expect(n2.connections[0]).toBe(n1);
    });

    describe("Special Properties", function() {
        var graph;
        beforeEach(function() {
            graph = new Graph();
            var n1 = new Node(new THREE.Vector3(1, 2));
            graph.addNode(n1);
            var n2 = new Node(new THREE.Vector3(3, 3));
            graph.addNode(n2);
            n1.addConnection(n2);
        });

        it("Stores by reference", function() {
            expect(graph.nodes[0]).toBe(graph.nodes[1].connections[0]);
        });
    });

    describe("ensureConnection", function() {

        var graph, n1, n2;

        beforeEach(function() {
            graph = new Graph();

            n1 = new Node(new THREE.Vector3(1, 2));
            graph.addNode(n1);
            n2 = new Node(new THREE.Vector3(3, 3));
            graph.addNode(n2);
        });

        it("should add a connection", function() {
            n1.ensureConnection(n2);
            expect(n1.hasConnection(n2)).toBeTruthy();
        });
        it("shouldn't add more than one", function() {
            n1.addConnection(n2);
            n1.ensureConnection(n2);
            expect(n1.connections.length).toEqual(1);
        });
    });
});

