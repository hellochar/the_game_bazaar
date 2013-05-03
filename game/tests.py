from django.test import TestCase
from game.views import LobbiesView, GameView
from game.models import Game
from lib.models import Map
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
    def setUp(self):
        User.objects.create_user("hosting_player", "email", "password")
        self.user = authenticate(username="hosting_player", password="password")

        User.objects.create_user("joining_player", "email", "password")
        self.joiner = authenticate(username="joining_player", password="password")

        self.aMap = Map(creator=self.user, num_players=3, data="{}", map_name="Oogie Boogie")
        self.aMap.save()

    def test_create_new_game(self):
        game, players_json = Game.create_new_game(self.aMap.id, self.user)
        self.assertEqual(len(players_json), 3)
        self.assertEqual(players_json[0], "hosting_player")
        pass

    def test_add_user_to_game(self):
        game, _ = Game.create_new_game(self.aMap.id, self.user)

        # Perform the join logic
        _, players_json, player_id = Game.add_user_to_game(game.id, self.joiner)

        # Check a bunch of conditions
        self.assertEqual(len(players_json), 3)
        self.assertEqual(players_json[0], "hosting_player")
        self.assertEqual(players_json[1], "joining_player")

    def test_rm_user_from_game(self):
        game, _ = Game.create_new_game(self.aMap.id, self.user)

        # Perform the join logic
        _, _, player_id = Game.add_user_to_game(game.id, self.joiner)

        # Perform the removing logic
        players_json = Game.rm_user_from_game(game.id, 1)

        # Check a bunch of conditions
        self.assertEqual(len(players_json), 3)
        self.assertEqual(players_json[0], "hosting_player")
        self.assertEqual(players_json[1], "")


class GameTest(TestCase):
    def setUp(self):
        User.objects.create_user("user", "email", "password")
        self.user = authenticate(username="user", password="password")

        self.map = Map(creator=self.user, num_players=2, data="{}", map_name="map name")
        self.map.save()

    def test_get_games_in_state(self):
        g1 = Game(map=self.map, players="['', '']", state=Game.LOBBY)
        g1.save()
        g2 = Game(map=self.map, players="['', '']", state=Game.LOBBY)
        g2.save()

        g3 = Game(map=self.map, players="['', '']", state=Game.ACTIVE)
        g3.save()

        lobby_games = set(list(Game.get_games_in_state(Game.LOBBY)))
        self.assertEqual(lobby_games, set([g1, g2]))

        active_games = set(list(Game.get_games_in_state(Game.ACTIVE)))
        self.assertEqual(active_games, set([g3]))

        finished_games = set(list(Game.get_games_in_state(Game.FINISHED)))
        self.assertEqual(finished_games, set([]))
