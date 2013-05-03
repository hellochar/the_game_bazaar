from django.test import TestCase
from game.views import LobbiesView, GameView
from game.sockets import GameNamespace
from game.models import Game
from lib.models import Map
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from socketio.virtsocket import Socket
from mock import MagicMock

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


class MockSocketIOServer(object):
    """Mock a SocketIO server"""
    def __init__(self, *args, **kwargs):
        self.sockets = {}

    def get_socket(self, socket_id=''):
        return self.sockets.get(socket_id)


class MockSocket(Socket):
    pass


class SocketIOTest(TestCase):
    def setUp(self):
        server = MockSocketIOServer()
        self.environ = {}
        socket = MockSocket(server, {})
        self.environ['socketio'] = socket
        self.ns = GameNamespace(self.environ, '/game')

        # Create mock objects for testing the socket
        self.ns.emit = MagicMock()
        self.ns.broadcast_to_room = MagicMock()
        self.ns.emit_to_room = MagicMock()
        self.ns.get_time = MagicMock(return_value=12242012)

        # Create a game with one user
        User.objects.create_user("hosting_player", "email", "password")
        self.user = authenticate(username="hosting_player", password="password")

        self.aMap = Map(creator=self.user, num_players=3, data="{}", map_name="Oogie Boogie")
        self.aMap.save()

        self.game, self.players_json = Game.create_new_game(self.aMap.id, self.user)

        self.ns.request = MockRequest()
        self.ns.request.user = self.user
        self.ns.request.META = {
            'QUERY_STRING': 'id=' + str(self.game.id)
        }

    def setUpState(self):
        self.ns.recv_connect()
        self.ns.on_join()

    def test_recv_connect(self):
        self.ns.recv_connect()
        self.assertEqual(self.ns.session['user'], self.user)
        self.assertEqual(self.ns.session['game_id'], self.game.id)

    def test_on_join(self):
        self.ns.recv_connect()
        self.ns.on_join()
        selfData = {
            'isHost': True,
            'map_id': self.game.map.id,
            'player_list': [v for v in self.players_json],
            'player_id': 0
        }
        self.ns.emit.assert_called_with('game_data', selfData)
        data = {
            'username': self.user.username,
            'timestamp': self.ns.get_time(),
            'player_id': 0
        }
        self.ns.emit_to_room.assert_called_with(str(self.game.id), 'join', data)

    def test_get_time(self):
        time = self.ns.get_time()
        self.assertEqual(time, 12242012)

    def test_broadcast_message(self):
        self.setUpState()
        self.ns.broadcast_message('message', {'data': 'data'})
        self.ns.broadcast_to_room.assert_called_with(str(self.game.id), 'message', {
            'player_id': 0,
            'timestamp': 12242012,
            'data': 'data'
        })

    def test_on_click(self):
        self.setUpState()
        self.ns.on_click({'data': 'data'})
        self.ns.broadcast_to_room.assert_called_with(str(self.game.id), 'click', {
            'player_id': 0,
            'timestamp': 12242012,
            'data': 'data'
        })

    def test_on_drag(self):
        self.setUpState()
        self.ns.on_drag({'data': 'data'})
        self.ns.broadcast_to_room.assert_called_with(str(self.game.id), 'drag', {
            'player_id': 0,
            'timestamp': 12242012,
            'data': 'data'
        })

    def test_on_start(self):
        self.setUpState()
        self.ns.on_start()
        self.ns.broadcast_to_room.assert_called_with(str(self.game.id), 'start', {
            'player_id': 0,
            'timestamp': 12242012
        })

    def test_on_start_guest(self):
        User.objects.create_user("joining_player", "email", "password")
        self.joiner = authenticate(username="joining_player", password="password")
        self.ns.request.user = self.joiner
        self.setUpState()
        self.ns.on_start()
        self.assertFalse(self.ns.broadcast_to_room.called)

    def test_on_leave(self):
        self.setUpState()
        self.ns.on_leave()
        self.ns.broadcast_to_room.assert_called_with(str(self.game.id), 'leave', {
            'player_id': 0,
            'timestamp': 12242012
        })

    def test_on_key(self):
        self.setUpState()
        self.ns.on_key({'data': 'data'})
        self.ns.broadcast_to_room.assert_called_with(str(self.game.id), 'key', {
            'player_id': 0,
            'timestamp': 12242012,
            'data': 'data'
        })

    def test_on_deadUnits(self):
        self.setUpState()
        self.ns.on_deadUnits({'data': 'data'})
        self.ns.broadcast_to_room.assert_called_with(str(self.game.id), 'deadUnits', {
            'player_id': 0,
            'timestamp': 12242012,
            'data': 'data'
        })

    def test_on_lostGame(self):
        self.setUpState()
        self.ns.on_lostGame({'data': 'data'})
        self.ns.broadcast_to_room.assert_called_with(str(self.game.id), 'lostGame', {
            'player_id': 0,
            'timestamp': 12242012,
            'data': 'data'
        })

    def test_on_wonGame(self):
        self.setUpState()
        self.ns.on_wonGame({'data': 'data'})
        self.ns.broadcast_to_room.assert_called_with(str(self.game.id), 'wonGame', {
            'player_id': 0,
            'timestamp': 12242012,
            'data': 'data'
        })

    def test_disconnect(self):
        self.setUpState()
        self.ns.disconnect()
        self.ns.broadcast_to_room.assert_called_with(str(self.game.id), 'leave', {
            'player_id': 0,
            'timestamp': 12242012
        })
