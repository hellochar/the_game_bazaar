from django.shortcuts import render
from django.http import HttpResponse
from django.utils import simplejson as json
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate
from django.contrib.auth import logout
from django.contrib.auth.models import User
from the_game_bazaar.models import Map
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import login as auth_login

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

@csrf_exempt
def map(request):
    if request.method == 'GET':
        if 'map_id' not in request.GET:
            return HttpResponse(json.dumps({'success': False, 'reason': "No map id supplied!"}), mimetype='application/json')

        try:
            map = Map.objects.get(id=request.GET['map_id'])
            return HttpResponse(json.dumps({'success': True, 'map_id' : map.id, 'map_data': json.loads(map.data)}), mimetype='application/json')
        except Map.DoesNotExist:
            return HttpResponse(json.dumps({'success': False, 'reason': "No map exists with given map id!"}), mimetype='application/json')

    elif request.method == 'POST':
        if 'map_id' not in request.POST:
            creator_id = User.objects.get(pk=1) #todo: make not bad
            num_players = 2 #uh oh
            map_name = "qwer"
            map = Map(
                    creator_id=creator_id,
                    num_players=num_players,
                    data=request.POST['map_data'],
                    map_name=map_name
                    )
        else:
            try:
                map = Map.objects.get(id=request.POST['map_id'])
                map.data = request.POST['map_data']
            except Map.DoesNotExist:
                return HttpResponse(json.dumps({'success': False, 'reason': "No map exists with given map id!"}), mimetype='application/json')

        map.save()
        return HttpResponse(json.dumps({'success': True, 'map_id' : map.id}), mimetype='application/json')
    else:
        pass # handle weird verbs


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
        auth_login(request, user)   
        resp['success'] = True

    return HttpResponse(json.dumps(resp), mimetype="application/json")

@require_http_methods(["POST"])
def ajax_register(request):
    username = request.POST['username']
    password = request.POST['password']
    email = request.POST['email']
    resp = {
        "success":False
    }
    
    try:
        user = User.objects.create_user(username, email, password)
        resp['success'] = True
    except:
        pass

    return HttpResponse(json.dumps(resp), mimetype="application/json")

@require_http_methods(["POST"])
def ajax_logout(request):
    logout(request)
    resp = {
        "success":True
    }

    return HttpResponse(json.dumps(resp), mimetype="application/json")