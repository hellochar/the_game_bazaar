from django.db import models

from django.contrib.auth.models import User


class Map(models.Model):
    # map_id is created by default
    creator = models.ForeignKey(User, related_name="+")
    num_players = models.IntegerField()
    data = models.TextField()
    map_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def to_map(this_map):
        return {
            'id': this_map.id,
            'creator': this_map.creator.username,
            'max_players': this_map.num_players,
            'name': this_map.map_name,
        }
