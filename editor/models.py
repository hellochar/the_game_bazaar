from django.db import models
from django.contrib.auth.models import User


class Map(models.Model):
    creator_id = models.ForeignKey(User)
    num_players = models.IntegerField()
    data = models.TextField()
    map_name = models.CharField(max_length=255)
