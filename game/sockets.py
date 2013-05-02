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
        self.broadcast_to_room(str(self.session['game_id']), message, data)

    def on_click(self, data):
        self.broadcast_message('click', data)

    def on_drag(self, data):
        self.broadcast_message('drag', data)

    def on_start(self):
        game = Game.objects.get(id=self.session['game_id'])
        game.state = Game.ACTIVE
        game.save()
        self.broadcast_message('start', {})

    def on_join(self, data):
        logging.getLogger("socketio").error(self.request)
        self.join(str(self.session['game_id']))
        self.broadcast_message('join', data)

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
