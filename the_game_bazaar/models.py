from django.db import models
from django.contrib.auth.models import User


class Map(models.Model):
    #map_id
    creator_id = models.ForeignKey(User, related_name="+")
    num_players = models.IntegerField()
    data = models.TextField()
    map_name = models.CharField(max_length=255)


class Game(models.Model):
    # There is nothing here but an id.
    pass
