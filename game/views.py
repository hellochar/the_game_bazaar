import logging

from socketio import socketio_manage
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from game.models import ChatNamespace
from game.models import GameNamespace
from django.shortcuts import render

SOCKETIO_NS = {
    '/chat': ChatNamespace,
    '/game': GameNamespace
}


@csrf_exempt
def socketio(request):
    try:
        socketio_manage(request.environ, SOCKETIO_NS, request)
    except:
        logging.getLogger("socketio").error("Exception while handling socketio connection", exc_info=True)
        return HttpResponse("")


# /game/host
def host_game(request):
    context = {
        'isHost': True
    }
    return render(request, 'the_game_bazaar/game.html', context)


# /game/join
def join_game(request, num):
    context = {
        'isHost': False
    }
    return render(request, 'the_game_bazaar/game.html', context)
