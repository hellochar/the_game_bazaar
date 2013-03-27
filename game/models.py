from django.db import models
from lib.models import Map


class Game(models.Model):
    LOBBY = "lobby"
    ACTIVE = "active"
    FINISHED = "finished"

    # The map id of this game.
    map_id = models.ForeignKey(Map, related_name="+")
    players = models.TextField()
    state = models.TextField()
