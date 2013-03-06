import logging

from socketio import socketio_manage
from django.conf.urls import patterns, url, include
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from backend.models import ChatNamespace

SOCKETIO_NS = {'': ChatNamespace}

@csrf_exempt
def socketio(request):
    try:
        socketio_manage(request.environ, SOCKETIO_NS, request)
    except:
        logging.getLogger("socketio").error("Exception while handling socketio connection", exc_info=True)
    return HttpResponse("")

urls = patterns("", (r'', socketio))
