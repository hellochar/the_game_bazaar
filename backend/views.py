from django.http import HttpResponse
from socketio import socketio_manage


def index(request):
	socketio_manage(environ, {'': ChatNamespace}, request)
	return HttpResponse("Hello, world. You're at the poll index.")