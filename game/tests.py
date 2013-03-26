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
    def setUp(self):
        User.objects.create_user("hosting_player", "email", "password")
        self.user = authenticate(username="hosting_player", password="password")

        User.objects.create_user("joining_player", "email", "password")
        self.joiner = authenticate(username="joining_player", password="password")

        self.aMap = Map(creator=self.user, num_players=3, data="{}", map_name="Oogie Boogie")
        self.aMap.save()


    def test_create_new_game(self):
        game, players_json = views.create_new_game(self.aMap.id, self.user)
        self.assertEqual(len(players_json), 3)
        self.assertEqual(players_json[0], "hosting_player")
        pass


    def test_joingame(self):
        game, _ = views.create_new_game(self.aMap.id, self.user)

        # Perform the join logic
        _, players_json, player_id = views.add_user_to_game(game.id, self.joiner)

        # Check a bunch of conditions
        self.assertEqual(len(players_json), 3)
        self.assertEqual(players_json[0], "hosting_player")
        self.assertEqual(players_json[1], "joining_player")
        pass
