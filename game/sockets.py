from socketio.namespace import BaseNamespace
from socketio.mixins import RoomsMixin, BroadcastMixin
from lib.sdjango import namespace
from game.models import Game
import time


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
        game_id = str(data['game_id'])
        del data['game_id']
        data['timestamp'] = self.get_time()
        self.broadcast_to_room(game_id, message, data)

    def on_click(self, data):
        self.broadcast_message('click', data)

    def on_drag(self, data):
        self.broadcast_message('drag', data)

    def on_start(self, data):
        game = Game.objects.get(id=data['game_id'])
        game.state = Game.ACTIVE
        game.save()
        self.broadcast_message('start', data)

    def on_join(self, data):
        self.join(str(data['game_id']))
        self.broadcast_message('join', data)

    def on_leave(self, data):
        self.leave(str(data['game_id']))
        self.broadcast_message('leave', data)

    def on_key(self, data):
        self.broadcast_message('key', data)

    def on_deadUnits(self, data):
        self.broadcast_message('deadUnits', data)

    def on_lostGame(self, data):
        self.broadcast_message('lostGame', data)

    def on_wonGame(self, data):
        self.broadcast_message('wonGame', data)
