from django.shortcuts import render
from the_game_bazaar.models import *


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

from django.views.decorators.csrf import *
@csrf_exempt
def map(request):
    from django.http import HttpResponse
    import json

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
