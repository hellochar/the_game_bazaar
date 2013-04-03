from django.db import models
from lib.models import Map
from django.utils import simplejson as json


class Game(models.Model):
    LOBBY = "lobby"
    ACTIVE = "active"
    FINISHED = "finished"
    STATE_CHOICES = (
        (LOBBY, "Lobby"),
        (ACTIVE, "Active"),
        (FINISHED, "Finished"),
    )

    #----------------------
    #      FIELDS
    #----------------------
    map = models.ForeignKey(Map, related_name="+")
    players = models.TextField() # a list of usernames in the game stored as "[username, username, ...]"
    state = models.TextField(choices=STATE_CHOICES, default=LOBBY)

    @staticmethod
    def get_games_in_state(state):
        return Game.objects.filter(state=state)

    def to_map(game):
        return {
            'players': json.loads(game.players),
            'state': game.state,
            'id': game.id,
            'map_creator': game.map.creator.username,
            'map_name': game.map.map_name,
        }
