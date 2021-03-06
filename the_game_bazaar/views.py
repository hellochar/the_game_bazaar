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
from the_game_bazaar.models import Clan
from django.core.exceptions import ValidationError
from django.core.exceptions import ObjectDoesNotExist
import hashlib
import urllib
import urllib2
from django.core.validators import email_re
from django.utils.html import strip_tags

MAX_PASS_LENGTH = 30
MIN_PASS_LENGTH = 8
MAX_USERNAME_LENGTH = 30
MIN_USERNAME_LENGTH = 4

# helper functions
def getClan(user):
    clans = user.groups.all()
    if clans.count() > 0:
        return clans[0].name
    else:
        return None

# /
def index(request):
    context = {
        "user": request.user,
    }
    return render(request, 'the_game_bazaar/home.html', context)

# /home
def home(request):
    context = {}
    return render(request, 'the_game_bazaar/home.html', context)


# /edit
def edit(request):
    context = {
        "user": request.user,
        "maps": Map.objects.all(),
    }
    return render(request, 'the_game_bazaar/edit.html', context)


# /list
# What does this even do?
# def list_games(request):
#   context = {
#   }
#   return render(request, 'the_game_bazaar/play.html', context)

# /user stuff
def user_admin(request):
    context = {
        "user": request.user,
    }
    return render(request, 'the_game_bazaar/user_admin.html', context)


def user_history(request):
    games = Game.objects.all()
    owned_games = []
    for game in games:
        players = json.loads(game.players)
        if(request.user.username in players):
            owned_games.append(game)

    context = {
        "user": request.user,
        "games": owned_games,
    }
    return render(request, 'the_game_bazaar/user_history.html', context)


###############################################################################
# AJAX
###############################################################################
@login_required(login_url='/', redirect_field_name=None)
def ajax_lobby_games(request):
    game_list = []
    games = Game.get_games_in_state(Game.LOBBY).order_by('id').reverse()
    for game in games:
        game_list.append(game.to_map())
    return HttpResponse(json.dumps(game_list), mimetype="application/json")

@login_required(login_url='/', redirect_field_name=None)
def ajax_history(request):
    # NOTE: don't need anything to pass anything because username is in
    # the user object of the request
    games = Game.objects.all()
    owned_games = []
    for game in games:
        players = json.loads(game.players)
        if(request.user.username in players):
            owned_games.append(game.to_map())

    return HttpResponse(json.dumps(owned_games), mimetype="application/json")

@login_required(login_url='/', redirect_field_name=None)
def ajax_maps(request):
    map_list = []
    maps = Map.objects.all()
    for a_map in maps:
        map_list.append(a_map.to_map())
    return HttpResponse(json.dumps(map_list), mimetype="application/json")

@login_required(login_url='/', redirect_field_name=None)
def ajax_gravatar(request):
    email = request.user.email
    size = 40
    if(request.method == 'GET' and 'size' in request.GET):
        size = request.GET['size']
    if(request.method == 'GET' and 'email' in request.GET):
        email = request.GET['email']

    gravatar_url = "<img src='http://www.gravatar.com/avatar/" + hashlib.md5(email.lower()).hexdigest() + "?"
    gravatar_url += urllib.urlencode({'s': str(size)})
    gravatar_url += "' />"
    return HttpResponse(gravatar_url, mimetype="text/html")

@require_http_methods(["GET"])
def ajax_pivotal(request):
    url = "http://www.pivotaltracker.com/services/v3/projects/762017/activities?limit=100"
    req = urllib2.Request(url, None, {'X-TrackerToken': '0a1a72aaf55aa64bce532441eda2d35d'})
    response = urllib2.urlopen(req)

    return HttpResponse(response, mimetype="xml")
###############################################################################
# CLAN API
###############################################################################
@login_required(login_url='/', redirect_field_name=None)
@require_http_methods(["POST"])
def create_clan(request):
    resp = {
        "success": False,
    }

    if('name' in request.POST):
        clan = Clan()
        clan.name = strip_tags(request.POST['name'])
        clan.creator = request.user
        try:
            clan.save()
            request.user.groups.add(clan)
            resp['success'] = True
        except:
            resp['error'] = "That clan already exists"
    else:
        resp['error'] = 'you must supply a name'

    return HttpResponse(json.dumps(resp), mimetype="application/json")

@login_required(login_url='/', redirect_field_name=None)
@require_http_methods(["POST"])
def join_clan(request):
    resp = {
        "success": False,
    }
    if (request.user.groups.all().count() >= 1):
        resp['error'] = "You cannot join more than 1 clan"
    elif ('name' in request.POST):
        try:
            clan = Clan.objects.get(name=request.POST['name'])
            request.user.groups.add(clan)
            resp['success'] = True
        except ObjectDoesNotExist, e:
            resp['error'] = "Clan does not exist"
    else:
        resp['error'] = "You must specify which clan to join"

    return HttpResponse(json.dumps(resp), mimetype="application/json")

@login_required(login_url='/', redirect_field_name=None)
@require_http_methods(["POST"])
def leave_clan(request):
    resp = {
        "success": False,
    }

    request.user.groups.clear()

    resp['success'] = True

    return HttpResponse(json.dumps(resp), mimetype="application/json")

@login_required(login_url='/', redirect_field_name=None)
@require_http_methods(["GET"])
def members_clan(request):
    resp = {
        "success": False,
    }

    clan = getClan(request.user)
    if (clan == None):
        resp['error'] = "You are not part of a clan"
    else:
        members = []

        clan_obj = Clan.objects.get(name=clan);

        for member in clan_obj.user_set.all():
            members.append(member.username)

        resp['success'] = True
        resp['data'] = members
        resp['owner'] = clan_obj.creator.username

    return HttpResponse(json.dumps(resp), mimetype="application/json")


###############################################################################
# AUTHENTICATION API
###############################################################################
def login(request):
    context = {}
    return render(request, 'the_game_bazaar/login.html', context)

@require_http_methods(["GET"])
def ajax_is_authenticated(request):
    logged_in = request.user.is_authenticated()

    resp = {
        "success": logged_in,
    }

    if logged_in:
        resp["username"] = request.user.username
        resp["gravatar"] = ajax_gravatar(request).content
        resp["email"] = request.user.email
        resp["clan"] = getClan(request.user)

    return HttpResponse(json.dumps(resp), mimetype="application/json")

@login_required(login_url='/', redirect_field_name=None)
@require_http_methods(["POST"])
def ajax_change(request):
    resp = {
        "success": False,
    }
    if('old_pass' in request.POST and 'new_pass' in request.POST):
        #got a change for pass
        #check to make sure old_pass matches
        user = authenticate(username=request.user.username, password=request.POST['old_pass'])
        if(user is not None and user.is_active):
            #old pass matches, change pass to new one
            if len(request.POST['new_pass']) < MIN_PASS_LENGTH or len(request.POST['new_pass']) > MAX_PASS_LENGTH:
                resp['error'] = 'Passwords must be 8-30 characters'
            else:
                user.set_password(request.POST['new_pass'])
                user.save()
                resp['success'] = True
        else:
            #old pass didn't match, pass back an error
            resp['error'] = 'The password is incorrect. Did you forget it?'
    elif('email' in request.POST):
        #got a change for email
        if not email_re.match(request.POST['email']):
            resp['error'] = 'Please enter a valid email'
        else:
            request.user.email = request.POST['email']
            request.user.save()
            resp['success'] = True
    else:
        resp['error'] = 'Please fill out all the fields. They are all necessary'

    return HttpResponse(json.dumps(resp), mimetype="application/json")


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
        resp['username'] = user.username
        resp['gravatar'] = ajax_gravatar(request).content
        resp['email'] = user.email
        resp['clan'] = getClan(user)

    return HttpResponse(json.dumps(resp), mimetype="application/json")


@require_http_methods(["POST"])
def ajax_register(request):
    username = strip_tags(request.POST['username'])
    password = request.POST['password']
    email = strip_tags(request.POST['email'])
    resp = {
        "success": False
    }

    # Check the email
    if not email_re.match(email):
        resp['error'] = 'Please enter a valid email'
        return HttpResponse(json.dumps(resp), mimetype="application/json")

    # Check username length
    if len(username) < MIN_USERNAME_LENGTH or len(username) > MAX_USERNAME_LENGTH:
        resp['error'] = 'A username must be 4-20 characters'
        return HttpResponse(json.dumps(resp), mimetype="application/json")

    # Check password length
    if len(password) < MIN_PASS_LENGTH or len(password) > MAX_PASS_LENGTH:
        resp['error'] = 'A password must be 8-30 characters'
        return HttpResponse(json.dumps(resp), mimetype="application/json")


    # try/except catches bad usernames and passwords
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
