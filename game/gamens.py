from socketio.namespace import BaseNamespace
from socketio.mixins import RoomsMixin, BroadcastMixin
import time

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

    def on_input(self, data):
        game_id = data['game_id']
        del data['game_id']
        data['timestamp'] = time.mktime(time.localtime())
        self.broadcast_to_room(game_id, 'input', data)

    def on_start(self, data):
        game_id = data['game_id']
        del data['game_id']
        data['timestamp'] = time.mktime(time.localtime())
        self.broadcast_to_room(game_id, 'start', data)

    def on_join(self, data):
        game_id = data['game_id']
        del data['game_id']
        self.join(game_id)
        data['timestamp'] = time.mktime(time.localtime())
        self.broadcast_to_room(game_id, 'join', data)

    def on_leave(self, data):
        game_id = data['game_id']
        del data['game_id']
        self.leave(game_id)
        data['timestamp'] = time.mktime(time.localtime())
        self.broadcast_to_room(game_id, 'leave', data)
