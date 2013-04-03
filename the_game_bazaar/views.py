from django.shortcuts import render
from django.http import HttpResponse
from django.utils import simplejson as json
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth import login as auth_login
from lib.models import Map
from game.models import Game
from django.db import IntegrityError

# /
def index(request):
    context = {
        "user": request.user,
    }
    if request.user.is_authenticated():
        return render(request, 'the_game_bazaar/home.html', context)
    else:
        return render(request, 'the_game_bazaar/login.html', context)


# /home
@login_required(login_url='/', redirect_field_name=None)
def home(request):
    context = {}
    return render(request, 'the_game_bazaar/home.html', context)


# /play
@login_required(login_url='/', redirect_field_name=None)
def play(request):
    context = {
        "maps": Map.objects.all(),
        "lobby_games": Game.get_games_in_state(Game.LOBBY).order_by('id').reverse(),
    }
    return render(request, 'the_game_bazaar/play.html', context)


# /edit
@login_required(login_url='/', redirect_field_name=None)
def edit(request):
    context = {
        "maps": Map.objects.all(),
    }
    return render(request, 'the_game_bazaar/edit.html', context)


# /list
def list_games(request):
    context = {
    }
    return render(request, 'the_game_bazaar/play.html', context)

###############################################################################
# UI AJAX
###############################################################################
@login_required(login_url='/', redirect_field_name=None)
def ajax_lobby_games(request):
    game_list = []
    games = Game.get_games_in_state(Game.LOBBY).order_by('id').reverse()
    for game in games:
        game_list.append(game.to_map())
    return HttpResponse(json.dumps(game_list), mimetype="application/json")

def ajax_maps(request):
    map_list = []
    maps = Map.objects.all()
    for a_map in maps:
        map_list.append(a_map.to_map())
    return HttpResponse(json.dumps(map_list), mimetype="application/json")


###############################################################################
# AUTHENTICATION 
###############################################################################
@login_required(login_url='/', redirect_field_name=None)
def login(request):
    context = {}
    return render(request, 'the_game_bazaar/login.html', context)


@require_http_methods(["POST"])
def ajax_login(request):
    username = request.POST['username']
    password = request.POST['password']
    user = authenticate(username=username, password=password)

    resp = {
        "success": False,
    }
    if user is not None and user.is_active:
        # the password verified for the user
        auth_login(request, user)
        resp['success'] = True

    return HttpResponse(json.dumps(resp), mimetype="application/json")


@require_http_methods(["POST"])
def ajax_register(request):
    username = request.POST['username']
    password = request.POST['password']
    email = request.POST['email']
    resp = {
        "success": False
    }

    try:
        User.objects.create_user(username, email, password)
        user = authenticate(username=username, password=password)
        auth_login(request, user)
        resp['success'] = True
        resp['redirect_url'] = '/home'
    except IntegrityError:
        resp['error'] = username + ' already exists. Did you forget your password?'
    except:
        resp['error'] = 'Please check that all fields are properly filled out'

    return HttpResponse(json.dumps(resp), mimetype="application/json")


@require_http_methods(["POST"])
@login_required(login_url='/', redirect_field_name=None)
def ajax_logout(request):
    logout(request)
    resp = {
        "success": True
    }

    return HttpResponse(json.dumps(resp), mimetype="application/json")
