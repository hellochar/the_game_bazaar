from django.db import models
from socketio.namespace import BaseNamespace
from socketio.mixins import RoomsMixin, BroadcastMixin
import time


class GameNamespace(BaseNamespace, RoomsMixin, BroadcastMixin):
    # The method that handles user input
    def on_user_input(self, game_id, player_id, player_input):
        # Find out which room we are broadcasting to.
        game_name = 'game_' + game_id
        # Get the server timestamp for syncing purposes.
        timestamp = time.localtime()
        # Broadcast to the game room what the client's input was.
        self.emit_to_room(game_name, 'user_input', timestamp, player_id, player_input)


# Create your models here.
class ChatNamespace(BaseNamespace, RoomsMixin, BroadcastMixin):
    def on_nickname(self, nickname):
        # self.request['nicknames'].append(nickname)
        self.socket.session['nickname'] = nickname
        self.broadcast_event('announcement', '%s has connected' % nickname)
        # self.broadcast_event('nicknames', self.request['nicknames'])
        # Just have them join a default-named room
        self.join('main_room')

    def recv_disconnect(self):
        # Remove nickname from the list.
        nickname = self.socket.session['nickname']
        # self.request['nicknames'].remove(nickname)
        self.broadcast_event('announcement', '%s has disconnected' % nickname)
        # self.broadcast_event('nicknames', self.request['nicknames'])

        self.disconnect(silent=True)

    def on_user_message(self, msg):
        self.emit_to_room(
            'main_room', 'msg_to_room',
            self.socket.session['nickname'], msg)

    def on_user_start(self, msg):
        self.broadcast_event('msg_to_room', '%s' % msg)

    def recv_message(self, message):
        print "PING!!!", message
