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
    # Get the map object that we want to host a game of
    map_id = request.POST['map-id']
    theMap = Map.objects.get(pk=map_id)
    # Create the players dictionary (only the host at the moment)
    players_json = {0: request.user.username}
    # Create and save the game
    game = Game(map_id=theMap, players=json.dumps(players_json))
    game.save()

    # Render the context with our parameters.
    context = {
        'isHost': True,
        'game_id': game.id,
        'map_id': map_id,
        'player_id': 0,
        'players': players_json
    }
    return render(request, 'game/game.html', context)


# /game/join
def join_game(request):
    try:
        # This is the real code that should run
        game_id = int(request.POST['game-id'])
        game = Game.objects.get(pk=game_id)
        players_json = json.loads(game.players)
        players_json[len(players_json)] = request.user.username
        game.players = json.dumps(players_json)
    except:
        # This is debugging code that realistically shouldn't be reached.
        game_id = 'no_game_id'
        game = {'map_id': 'no_map_id'}
        players_json = {0: 'first_default_player', 1: 'second_default_player'}
    context = {
        'isHost': False,
        'game_id': game_id,
        'map_id': game.map_id,
        'players': players_json,
        'player_id': len(players_json) - 1
    }
    return render(request, 'game/game.html', context)


# /game/userlist
# Returns a list of users in the game_id provided
def user_list(request):
    game_id = request.GET['game_id']
    game = Game.objects.get(pk=game_id)
    return HttpResponse(json.loads(game.players), mimetype="application/json")
