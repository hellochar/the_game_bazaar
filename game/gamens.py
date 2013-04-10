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

    def get_time(self):
        return int(time.time() * 1000)

    def on_click(self, data):
        game_id = str(data['game_id'])
        del data['game_id']
        data['timestamp'] = self.get_time()
        self.broadcast_to_room(game_id, 'click', data)

    def on_drag(self, data):
        game_id = str(data['game_id'])
        del data['game_id']
        data['timestamp'] = self.get_time()
        self.broadcast_to_room(game_id, 'drag', data)

    def on_start(self, data):
        game_id = str(data['game_id'])
        del data['game_id']
        data['timestamp'] = self.get_time()
        self.broadcast_to_room(game_id, 'start', data)

    def on_join(self, data):
        game_id = str(data['game_id'])
        del data['game_id']
        self.join(game_id)
        data['timestamp'] = self.get_time()
        self.emit_to_room(game_id, 'join', data)

    def on_leave(self, data):
        game_id = str(data['game_id'])
        del data['game_id']
        self.leave(game_id)
        data['timestamp'] = self.get_time()
        self.broadcast_to_room(game_id, 'leave', data)
