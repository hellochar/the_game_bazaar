import logging

from socketio import socketio_manage
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from game.gamens import GameNamespace
from django.shortcuts import render
from lib.models import Map
from game.models import Game
import json

SOCKETIO_NS = {
    '/game': GameNamespace
}


@csrf_exempt
def socketio(request):
    try:
        socketio_manage(request.environ, SOCKETIO_NS, request)
    except:
        logging.getLogger("socketio").error("Exception while handling socketio connection" + str(request), exc_info=True)
        return HttpResponse("")


# /game/host
def host_game(request):
    game, players_json = create_new_game(request.POST['map-id'], request.user)
    # Render the context with our parameters.
    context = {
        'isHost': True,
        'game_id': game.id,
        'map_id': game.map_id.id,
        'player_id': 0,
        'players_json': [(k, v) for k, v in enumerate(players_json)]
    }
    return render(request, 'game/game.html', context)


# Adds a new Game entry into the db with the specified host
def create_new_game(map_id, host):
    # Get the map object that we want to host a game of
    # TODO: if the map_id is empty, you should display an error!

    theMap = Map.objects.get(pk=map_id)
    # Create the players array (only the host at the moment)
    players_json = [""] * theMap.num_players
    players_json[0] = host.username
    # Create and save the game
    game = Game(map_id=theMap, players=json.dumps(players_json), state=Game.LOBBY)
    game.save()
    return game, players_json


# /game/join
def join_game(request):
    game, players_json, player_id = add_user_to_game(request.POST['game-id'], request.user)

    # Render the context with our parameters.
    context = {
        'isHost': player_id == 0,
        'game_id': game.id,
        'map_id': game.map_id.id,
        'players_json': [(k, v) for k, v in enumerate(players_json)],
        'player_id': player_id
    }
    return render(request, 'game/game.html', context)


# Returns (game object, [username, username, username], my_player_id)
def add_user_to_game(game_id, user):
    # This is the real code that should run
    # TODO: if the game_id is empty, you should display an error!
    game = Game.objects.get(pk=game_id)

    # Add this player to the player list for the game.
    players_json = json.loads(game.players)
    # If the user isn't already in the game, add them to it.
    player_id = -1
    for key, value in enumerate(players_json):
        # If the user is already in the game or there is an empty spot, add him.
        if user.username == value or value == "":
            players_json[key] = user.username
            player_id = key
    # TODO handle a user rejection gracefully
    assert player_id != -1, "No empty slot for player " + user.username + " in json " + json.dumps(players_json)
    game.players = json.dumps(players_json)
    game.save()

    return game, players_json, player_id
