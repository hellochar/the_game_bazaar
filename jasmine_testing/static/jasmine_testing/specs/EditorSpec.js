describe("Map Editor", function() {
  beforeEach(function() {
    //create fake ui elements
    $('<div/>', {id: 'hidden-ui', style: 'display: none'}).appendTo('body');

    $('<div/>', {id: 'map-id'}).appendTo('#hidden-ui');
    $('<canvas/>', {id: 'editor-canvas'}).appendTo('#hidden-ui');
  });
  afterEach(function() {
    $('#hidden-ui').remove();
  });

  describe("createDefaultMap", function() {
    var map;
    beforeEach(function() {
      map = createDefaultMap();
    });
    it("should generate a default Map", function() {
      expect(map).toEqual(jasmine.any(GameState));
    });
    it("should not have a map id", function() {
      expect(map.id).toBeUndefined();
    });
  });

  describe("createMapFromResponse", function() {
    it("should correctly set map_id", function() {
      var response = {
        map_id : 12,
        success : true,
        map_data : JSON.stringify(createDefaultMap().toJSON()),
      };
      var created_map = createMapFromResponse(response);
      expect(created_map.id).toEqual(12);
    });
  });

  describe("setEditingMap", function() {
    var map;
    beforeEach(function() {
      map = createDefaultMap();
    });
    it("should set the window.map variable and #map-id's text", function() {
      setEditingMap(map);
      expect(window.map).toEqual(map);
      expect($('#map-id').text()).toEqual('');
    });

    it("should update #map-id text when it changes", function() {
      map.id = 9;
      setEditingMap(map);
      expect($('#map-id').text()).toEqual('9');

      var newMap = createDefaultMap();
      newMap.id = 12;
      setEditingMap(newMap);
      expect($('#map-id').text()).toEqual('12');
    });
  });

  describe("saveMap", function() {
  });

  describe("loadMap", function() {
  });

  describe("currentPlayer", function() {
  });

});

