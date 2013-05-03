describe("Map Editor", function() {
    var editor;
    beforeEach(function() {
        //create fake ui elements
        loadFixtures('editor.html', 'game-canvas.html');

        var ui_renderer = new UIRenderer(document.getElementById('game-ui'));
        //stub out actually rendering
        spyOn(ui_renderer, 'startRendering');

        editor = new Editor(null, ui_renderer);
        editor.init();
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
        var response;
        beforeEach(function() {
                response = {
                        map_id : 12,
                        success : true,
                        map_data : JSON.stringify(Editor.createDefaultMap().toJSON())
                };
        });
        it("should correctly set map_id", function() {
            var created_map = Editor.createMapFromResponse(response);
            expect(created_map.id).toEqual(12);
        });
        it("should parse the Map from the response and fromJSON it", function() {
            spyOn(GameState, 'fromJSON').andCallThrough();

            Editor.createMapFromResponse(response);
            expect(GameState.fromJSON).toHaveBeenCalledWith(JSON.parse(response.map_data));
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

    describe("setPalette", function() {
        var oldPalette, newPalette;
        beforeEach(function() {
            oldPalette = editor.palette;
            newPalette = new UnitSelectionPalette(editor);
        });
        it("should switch out domElements", function() {
            editor.setPalette(newPalette);
            expect($('#palette')).not.toContain(oldPalette.domElement);
            expect($('#palette')).toContain(newPalette.domElement);
        });
        it("should trigger selectionLost/selectionGained", function() {
            spyOnEvent(oldPalette, 'selectionLost');
            spyOnEvent(newPalette, 'selectionGained');
            editor.setPalette(newPalette);
            expect('selectionLost').toHaveBeenTriggeredOn(oldPalette);
            expect('selectionGained').toHaveBeenTriggeredOn(newPalette);
        });
        it("should set the active palette var", function() {
            editor.setPalette(newPalette);
            expect(editor.palette).toBe(newPalette);
        });
    });

    describe("saveMap", function() {
        beforeEach(function() {
            var fakeData = {success: true, map_id: 100};
            spyOn($, "ajax").andCallFake(function(params) {
                params.success(fakeData);
            });
        });

        it("should POST to /map/<mapid> with map data", function() {
            editor.map.id = 10;
            editor.saveMap("mapname");

            var request = $.ajax.mostRecentCall.args[0];
            expect(request.url).toBe('/map/10');
            expect(request.type).toBe('POST');
            expect(request.data).toEqual({map_id: 10, num_players: 2, map_name: "mapname", map_data: JSON.stringify(editor.map.toJSON())});
        });

        it("should call setEditingMap with its own map", function() {
                spyOn(editor, 'setEditingMap');
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
            var fakeData;
            beforeEach(function() {
                    editor.map.addUnit(editor.map.players[0], new THREE.Vector3(10, 100, 0));
                    fakeData = {success : true, map_id: 10, map_data: JSON.stringify(editor.map.toJSON())};

                    var ajax_params;
                    spyOn($, "ajax").andCallFake(function(params) {
                            params.success(fakeData);
                            ajax_params = params;
                    });
            });
            it("should GET /map/<mapid>", function() {
                    editor.loadMap(10);

                    var request = $.ajax.mostRecentCall.args[0];
                    expect(request.url).toBe('/map/10');
                    expect(request.type).toBe('GET');
            });

            it("should load a map it gets back", function() {
                    spyOn(editor, 'setEditingMap');
                    spyOn(Editor, 'createMapFromResponse');
                    editor.loadMap(10);

                    expect(Editor.createMapFromResponse).toHaveBeenCalledWith(fakeData);
                    expect(editor.setEditingMap).toHaveBeenCalled();
                    expect(editor.map.players[0].units[0].pos(0)).toEqual(new THREE.Vector3(10, 100, 0));
            });
    });

    describe("Palette", function() {
    });
    describe("UnitPalette", function() {
        var palette;
        beforeEach(function() {
            palette = new UnitPalette(editor);
            editor.setPalette(palette);
        });

        describe("input events", function() {
            it("should switch to unit selection when pressing space", function() {
                $(editor.ui_renderer.canvas).trigger('keyup', {
                    keyCode: 32 // 32 == space keycode
                });
                expect(editor.palette).toEqual(jasmine.any(UnitSelectionPalette));
            });
            it("should tryAddUnit on a leftclick", function() {
                spyOn(palette, 'tryAddUnit');
                palette.handleClick(1, new THREE.Vector3());
                expect(palette.tryAddUnit).toHaveBeenCalled();
            });
        });


        describe("tryAddUnit", function() {
            it("should get properties from the input elements", function() {
            });
            it("should addUnit if there are no unitsTouchingSphere", function() {
            });
            it("shouldn't addUnit if there are unitsTouchingSphere", function() {
            });
        });

        describe("currentPlayer", function() {
                it("retrieves the checked input's val", function() {
                        expect(palette.currentPlayer()).toEqual(editor.map.players[0]);

                        $('input[name=player]', palette.domElement).val(1);
                        expect(palette.currentPlayer()).toEqual(editor.map.players[1]);

                });
        });

    });

    describe("UnitSelectionPalette", function() {
    });

    describe("ObstaclePalette", function() {
    });

});
