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
    game, players_json = host_game_logic
    # Render the context with our parameters.
    context = {
        'isHost': True,
        'game_id': game.id,
        'map_id': request.POST['map-id'],
        'player_id': 0,
        'players': players_json
    }
    return render(request, 'game/game.html', context)


def host_game_logic(request):
    # Get the map object that we want to host a game of
    map_id = request.POST['map-id']
    # TODO: if the map_id is empty, you should display an error!

    theMap = Map.objects.get(pk=map_id)
    # Create the players dictionary (only the host at the moment)
    players_json = {0: request.user.username}
    # Create and save the game
    game = Game(map_id=theMap, players=json.dumps(players_json))
    game.save()
    return game, players_json


# /game/join
def join_game(request):
    game, players_json = join_game_logic(request)

    # Render the context with our parameters.
    context = {
        'isHost': False,
        'game_id': request.POST['game-id'],
        'map_id': game.map_id.id,
        'players': players_json,
        'player_id': len(players_json) - 1
    }
    return render(request, 'game/game.html', context)


def join_game_logic(request):
    # This is the real code that should run
    game_id = request.POST['game-id']
    # TODO: if the game_id is empty, you should display an error!
    game = Game.objects.get(pk=game_id)

    # Add this player to the player list for the game.
    players_json = json.loads(game.players)
    # If the user isn't already in the game, add them to it.
    if request.user.username not in [value for key, value in players_json.items()]:
        players_json[len(players_json)] = request.user.username
        game.players = json.dumps(players_json)
        game.save()

    return game, players_json


# /game/userlist
# Returns a list of users in the game_id provided
def user_list(request):
    game_id = request.GET['game_id']
    # TODO: if the game_id is empty, you should display an error!
    game = Game.objects.get(pk=game_id)
    response = {
        'success': True,
        'players': json.loads(game.players)
    }
    return HttpResponse(json.dumps(response), mimetype="application/json")
