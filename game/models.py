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
    players = models.TextField()  # a list of usernames in the game stored as "[username, username, ...]"
    state = models.TextField(choices=STATE_CHOICES, default=LOBBY)
    created_at = models.DateTimeField(auto_now_add=True)

    @staticmethod
    def get_games_in_state(state):
        return Game.objects.filter(state=state)

    # Helper method: Adds a new Game entry into the db with the specified host
    @staticmethod
    def create_new_game(map_id, host):
        theMap = Map.objects.get(pk=map_id)
        # Create the players array (only the host at the moment)
        players_json = [""] * theMap.num_players
        players_json[0] = host.username

        game = Game(map=theMap, players=json.dumps(players_json), state=Game.LOBBY)
        game.save()
        return game, players_json

    # Helper Method: Returns (game object, [username, username, username], my_player_id)
    @staticmethod
    def add_user_to_game(game_id, user):
        game = Game.objects.get(pk=game_id)

        # Add this player to the player list for the game.
        players_json = json.loads(game.players)
        # If the user isn't already in the game, add them to it.
        player_id = -1
        for idx, username in enumerate(players_json):
            # If the user is already in the game or there is an empty spot, put him there
            if user.username == username or username == '':
                players_json[idx] = user.username
                player_id = idx
                break

        # TODO handle a user rejection gracefully
        assert player_id != -1, "No empty slot for player " + user.username + " in json " + json.dumps(players_json)
        game.players = json.dumps(players_json)
        game.save()

        return game, players_json, player_id

    def to_map(game):
        return {
            'players': json.loads(game.players),
            'state': game.state,
            'id': game.id,
            'map_creator': game.map.creator.username,
            'map_name': game.map.map_name,
        }
