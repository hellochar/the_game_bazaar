from django.db import models

from django.contrib.auth.models import User


class Map(models.Model):
    # map_id is created by default
    creator = models.ForeignKey(User, related_name="+")
    num_players = models.IntegerField()
    data = models.TextField()
    map_name = models.CharField(max_length=255)
