from django.test import TestCase
from game import views
from game.models import Game
from gmap.models import Map
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
import json


class MockRequest:
    GET = {}


class GameControllerTest(TestCase):
    def setUp(self):
        User.objects.create_user("username", "email", "password")
        user = authenticate(username="username", password="password")
        aMap = Map(creator_id=user, num_players=3, data="{}", map_name="Oogie Boogie")
        aMap.save()

    def test_userlist(self):
        game = Game(map_id=Map.objects.all()[0], players='"{0: "player1", "1": "player2"}"')
        game.save()
        req = MockRequest()
        req.GET = {
            "game_id": game.id
        }
        resp = views.user_list(req)
        data = json.loads(resp.content)['players']
        data = json.loads(data)
        for key, value in data.items():
            print "Key is " + key
            print "Value is " + value
        self.assertTrue(0 in data)
        self.assertTrue(1 in data)
        self.assertEqual('player1', data[0])
        self.assertEqual('player2', data[1])
        pass

    def test_hostgame(self):
        pass

    def test_joingame(self):
        pass
