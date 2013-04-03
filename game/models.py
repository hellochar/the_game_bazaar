from django.db import models
from lib.models import Map

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
    created_at = models.DateTimeField(auto_now_add = True)

    @staticmethod
    def get_games_in_state(state):
        return Game.objects.filter(state=state)
