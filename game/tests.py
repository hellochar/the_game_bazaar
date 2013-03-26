from django.test import TestCase
from game import views
from game.models import Game
from gmap.models import Map
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
import json


# A mock request to be used in the tests
class MockRequest:
    GET = {}
    POST = {}

    class MockUser:
        username = ""
    user = MockUser()


# functional tests for the game controller methods
class GameControllerTest(TestCase):
    map_id = 0

    def setUp(self):
        User.objects.create_user("username", "email", "password")
        user = authenticate(username="username", password="password")
        aMap = Map(creator=user, num_players=3, data="{}", map_name="Oogie Boogie")
        aMap.save()
        GameControllerTest.map_id = aMap.id

    def test_userlist(self):
        game = Game(map_id=Map.objects.get(id=GameControllerTest.map_id), players=u'{"0": "player1", "1": "player2"}')
        game.save()
        req = MockRequest()
        req.GET = {
            "game_id": game.id
        }
        resp = views.user_list(req)
        data = json.loads(resp.content)['players']
        self.assertTrue("0" in data)
        self.assertTrue("1" in data)
        self.assertEqual('player1', data["0"])
        self.assertEqual('player2', data["1"])
        pass

    def test_hostgame(self):
        # Create the request object
        req = MockRequest()
        req.POST = {
            "map-id": GameControllerTest.map_id
        }
        req.user.username = "hosting_player"

        # Perform the logic on our Mock Request
        game, players_json = views.host_game_logic(req)
        self.assertTrue(0 in players_json)
        self.assertEqual(len(players_json), 1)
        self.assertEqual(players_json[0], "hosting_player")
        pass

    def test_joingame(self):
        # Do the hosting of the game.
        req = MockRequest()
        req.POST = {
            "map-id": GameControllerTest.map_id
        }
        req.user.username = "hosting_player"
        game, players_json = views.host_game_logic(req)
        self.assertTrue(0 in players_json)
        self.assertEqual(players_json[0], "hosting_player")

        # Do the joining of the game.
        req.POST = {
            "game-id": game.id
        }
        req.user.username = "joining_player"

        # Perform the join logic
        game, players_json = views.join_game_logic(req)

        # Check a bunch of conditions
        self.assertTrue("0" in players_json)
        self.assertTrue(1 in players_json)
        self.assertEqual(len(players_json), 2)
        self.assertEqual(players_json["0"], "hosting_player")
        self.assertEqual(players_json[1], "joining_player")
        pass
