from django.db import models
from gmap.models import Map

class Game(models.Model):
    # The map id of this game.
    map_id = models.ForeignKey(Map, related_name="+")
    players = models.TextField()
