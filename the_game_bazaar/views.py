from django.shortcuts import render
from django.http import HttpResponse
from django.utils import simplejson as json
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate



# /
def index(request):
    context = {}
    return render(request, 'the_game_bazaar/home.html', context)


# /home
def home(request):
    context = {}
    return render(request, 'the_game_bazaar/home.html', context)


# /play
def play(request):
    context = {}
    return render(request, 'the_game_bazaar/play.html', context)


# /edit
def edit(request):
    context = {}
    return render(request, 'the_game_bazaar/edit.html', context)


# /list
def list_games(request):
    context = {}
    return render(request, 'the_game_bazaar/play.html', context)


def login(request):
    context = {}
    return render(request, 'the_game_bazaar/login.html', context)

@require_http_methods(["POST"])
def ajax_login(request):
    username = request.POST['username']
    password = request.POST['password']
    user = authenticate(username=username, password=password)

    resp = {
        "success":False,
    }
    if user is not None and user.is_active:
        # the password verified for the user
        resp['success'] = True

    return HttpResponse(json.dumps(resp), mimetype="application/json")

@require_http_methods(["POST"])
def ajax_register(request):
    username = request.POST['username']
    password = request.POST['password']
    email = request.POST['email']

    return HttpResponse(json.dumps(resp), mimetype="application/json")
