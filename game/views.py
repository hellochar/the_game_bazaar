import logging

from socketio import socketio_manage
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from game.gamens import GameNamespace
from django.shortcuts import render
from game.models import Game

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
    game = Game()
    game.save()
    print game.id
    context = {
        'isHost': True,
        'game_id': game.id
    }
    return render(request, 'game/game.html', context)


# /game/join
def join_game(request, num):
    context = {
        'isHost': False
    }
    return render(request, 'game/game.html', context)
