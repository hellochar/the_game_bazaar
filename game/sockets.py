from socketio.namespace import BaseNamespace
from socketio.mixins import RoomsMixin, BroadcastMixin
from lib.sdjango import namespace
from game.models import Game
import time
from urlparse import urlparse, parse_qs
import logging


@namespace('/game')
class GameNamespace(BaseNamespace, RoomsMixin, BroadcastMixin):

    def broadcast_to_room(self, room, event, *args):
        """This is sent to all in the room (in this particular Namespace)"""
        pkt = dict(type="event",
                   name=event,
                   args=args,
                   endpoint=self.ns_name)
        room_name = self._get_room_name(room)
        for sessid, socket in self.socket.server.sockets.iteritems():
            if 'rooms' not in socket.session:
                continue
            if room_name in socket.session['rooms']:
                socket.send_packet(pkt)

    # Returns UNIX time in milliseconds
    def get_time(self):
        return int(time.time() * 1000)

    def broadcast_message(self, message, data):
        data['timestamp'] = self.get_time()
        data['player_id'] = self.session['player_id']
        self.broadcast_to_room(str(self.session['game_id']), message, data)

    def on_click(self, data):
        self.broadcast_message('click', data)

    def on_drag(self, data):
        self.broadcast_message('drag', data)

    def on_start(self):
        if (self.session['isHost']):
            game = Game.objects.get(id=self.session['game_id'])
            game.state = Game.ACTIVE
            game.save()
            self.broadcast_message('start', {})
        else:
            # Don't do anything if the person isn't the host
            pass

    def on_join(self):
        game_id = self.session['game_id']
        user = self.session['user']
        # Join the game_id room on the sockets side
        self.join(str(game_id))

        # Add the user to the game on the database side
        try:
            game, players_json, player_id = Game.add_user_to_game(game_id, user)

            self.session['player_id'] = player_id

            # The host of the game is the person that created the game
            # WHICH HAPPENS TO BE player_id == 0 IN OUR IMPLEMENTATION
            # Perhaps we should fix this one day
            isHost = self.session['isHost'] = (player_id == 0)
            player_list = [v for k, v in enumerate(players_json)]

            # Send the new player information needed to join the map
            selfData = {
                'isHost': isHost,
                'map_id': game.map.id,
                'player_list': player_list,
                'player_id': player_id
            }
            self.emit('game_data', selfData)

            # Send all other players information needed to add the current
            # player to the game
            data = {
                'username': user.username,
                'timestamp': self.get_time(),
                'player_id': self.session['player_id']
            }
            self.emit_to_room(str(self.session['game_id']), 'join', data)
        except:
            # Find a better way to handle 'unable to join'
            pass

    def on_leave(self):
        self.leave(str(self.session['game_id']))
        self.broadcast_message('leave', {})

    def on_key(self, data):
        self.broadcast_message('key', data)

    def on_deadUnits(self, data):
        self.broadcast_message('deadUnits', data)

    def on_lostGame(self, data):
        self.broadcast_message('lostGame', data)
        # TODO: Change game.state to inactive when game is over?

    def on_wonGame(self, data):
        self.broadcast_message('wonGame', data)
        # TODO: Change game.state to inactive when game is over?

    def recv_connect(self):
        # Parse the querystring on socket connect
        query = parse_qs(self.request.META['QUERY_STRING'])
        try:
            # When the query is parsed, for some reason the value of each
            # entry for a key is stored in a list
            game_id = int(query['id'][0])
        except:
            # TODO: Better error handling for invalid game_id
            self.disconnect()

        self.session['user'] = self.request.user
        self.session['game_id'] = game_id

    def disconnect(self, silent=False):
        super(GameNamespace, self).disconnect(silent)
        logging.getLogger("socketio").error("Disconnect called!")
