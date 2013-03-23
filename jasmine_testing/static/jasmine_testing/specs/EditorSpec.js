describe("Map Editor", function() {
  var editor;
  beforeEach(function() {
    //create fake ui elements
    $('<div/>', {id: 'hidden-ui', style: 'display: none'}).appendTo('body');

    $('<div/>', {id: 'map-id'}).appendTo('#hidden-ui');
    $('<canvas/>', {id: 'editor-canvas'}).appendTo('#hidden-ui');

    editor = new Editor();
    //stub out render
    spyOn(editor, 'render')
  });

  afterEach(function() {
    $('#hidden-ui').remove();
  });

  describe("createDefaultMap", function() {
    var map;
    beforeEach(function() {
      map = Editor.createDefaultMap();
    });
    it("should generate a Map object", function() {
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
        map_data : JSON.stringify(Editor.createDefaultMap().toJSON()),
      };
      var created_map = Editor.createMapFromResponse(response);
      expect(created_map.id).toEqual(12);
    });
  });

  describe("setEditingMap", function() {
    var map;
    beforeEach(function() {
      map = Editor.createDefaultMap();
    });
    it("should set the window.map variable and #map-id's text", function() {
      editor.setEditingMap(map);
      expect(editor.map).toEqual(map);
      expect($('#map-id').text()).toEqual('');
    });

    it("should update #map-id text when it changes", function() {
      map.id = 9;
      editor.setEditingMap(map);
      expect($('#map-id').text()).toEqual('9');

      var newMap = Editor.createDefaultMap();
      newMap.id = 12;
      editor.setEditingMap(newMap);
      expect($('#map-id').text()).toEqual('12');
    });
  });

  describe("saveMap", function() {
    beforeEach(function() {
      var fakeData = {success: true, map_id: 100};
      spyOn($, "ajax").andCallFake(function(params) {
        params.success(fakeData);
      });
    });

    it("should POST to /map/ with map id and map data", function() {
      editor.map.id = 10;
      editor.saveMap();

      var request = $.ajax.mostRecentCall.args[0];
      expect(request.url).toBe('/map/');
      expect(request.type).toBe('POST');
      expect(request.data).toEqual({map_id: 10, map_data: JSON.stringify(editor.map.toJSON())});
    });
    
    it("should call setEditingMap with its own map", function() {
        spyOn(editor, 'setEditingMap')
        editor.saveMap();

        expect(editor.setEditingMap).toHaveBeenCalledWith(editor.map);
    });

    it("should change the map_id when saving a new map", function() {
      editor.saveMap();

      window.editor = editor;
      expect(editor.map.id).toEqual(100);
    });
  });

  describe("loadMap", function() {
  });

  describe("currentPlayer", function() {
  });

});

