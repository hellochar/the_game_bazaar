from django.shortcuts import render
from django.http import HttpResponse
from django.utils import simplejson as json
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth import login as auth_login
from gmap.models import Map
from django.views.decorators.csrf import csrf_exempt


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
    context = {}
    return render(request, 'the_game_bazaar/play.html', context)


# /edit
@login_required(login_url='/', redirect_field_name=None)
def edit(request):
    context = {}
    return render(request, 'the_game_bazaar/edit.html', context)


# /list
def list_games(request):
    context = {}
    return render(request, 'the_game_bazaar/play.html', context)


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
        resp['success'] = True
    except:
        pass

    return HttpResponse(json.dumps(resp), mimetype="application/json")


@require_http_methods(["POST"])
@login_required(login_url='/', redirect_field_name=None)
def ajax_logout(request):
    logout(request)
    resp = {
        "success": True
    }

    return HttpResponse(json.dumps(resp), mimetype="application/json")
