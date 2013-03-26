import logging

from socketio import socketio_manage
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from game.gamens import GameNamespace
from django.shortcuts import render
from gmap.models import Map
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
    game, players_json = host_game_logic(request)
    # Render the context with our parameters.
    context = {
        'isHost': True,
        'game_id': game.id,
        'map_id': request.POST['map-id'],
        'player_id': 0,
        'players': players_json
    }
    return render(request, 'game/game.html', context)


# Testable method for host_game
def host_game_logic(request):
    # Get the map object that we want to host a game of
    map_id = request.POST['map-id']
    # TODO: if the map_id is empty, you should display an error!

    theMap = Map.objects.get(pk=map_id)
    # Create the players dictionary (only the host at the moment)
    players_json = {0: request.user.username}
    for i in range(1, theMap.num_players):
        players_json[i] = ""
    # Create and save the game
    game = Game(map_id=theMap, players=json.dumps(players_json), state=Game.LOBBY)
    game.save()
    return game, players_json


# /game/join
def join_game(request):
    game, players_json, player_id = join_game_logic(request)

    # Render the context with our parameters.
    context = {
        'isHost': player_id == 0,
        'game_id': game.id,
        'map_id': game.map_id.id,
        'players': players_json,
        'player_range': range(0, game.map_id.num_players),
        'player_id': player_id
    }
    return render(request, 'game/game.html', context)


# Testable method for join_game
def join_game_logic(request):
    # This is the real code that should run
    game_id = request.POST['game-id']
    # TODO: if the game_id is empty, you should display an error!
    game = Game.objects.get(pk=game_id)

    # Add this player to the player list for the game.
    players_json = translateStringToIntKeys(json.loads(game.players))
    # If the user isn't already in the game, add them to it.
    player_id = -1
    for key, value in players_json.items():
        # If the user is already in the game or there is an empty spot, add him.
        if request.user.username == value or value == "":
            players_json[key] = request.user.username
            player_id = key
    # TODO handle a user rejection gracefully
    assert player_id != -1, "No empty slot for player " + request.user.username + " in json " + json.dumps(players_json)
    game.players = json.dumps(players_json)
    game.save()

    return game, players_json, player_id


# Takes a dictionary and tries to translate all the keys to ints.
# This ensures that iterating through the keys gives them to you in numerical order.
def translateStringToIntKeys(players):
    new_players = {}
    for key, value in players.items():
        new_players[int(key)] = value
    return new_players
