from django.http import HttpResponse
from django.utils import simplejson as json
from django.views.decorators.csrf import csrf_exempt
from gmap.models import Map
from django.contrib.auth.models import User

@csrf_exempt
def gmap(request):
    if request.method == 'GET':
        if 'map_id' not in request.GET:
            map_id = "";
        else:
            map_id = request.GET['map_id'];

        if not map_id:
            return HttpResponse(json.dumps({
                'success': False,
                'reason': "No map id supplied!"
                }), mimetype='application/json')

        try:
            game_map = Map.objects.get(id=map_id)
            return HttpResponse(json.dumps({
                'success': True, 
                'map_id' : game_map.id, 
                'map_data': game_map.data, #send the string
                }), mimetype='application/json')
        except Map.DoesNotExist:
            return HttpResponse(json.dumps({
                'success': False,
                'reason': "No map exists with given map id!"
                }), mimetype='application/json')

    elif request.method == 'POST':
        if 'map_id' not in request.POST:
            map_id = "";
        else:
            map_id = request.POST['map_id'];

        if not map_id:
            creator = request.user
            num_players = 2 #uh oh
            map_name = "qwer"
            game_map = Map(
                    creator=creator,
                    num_players=num_players,
                    data=request.POST['map_data'], #gets stored as a string
                    map_name=map_name
                    )

            # import logging
            # logger = logging.getLogger("socketio")
            # logger.critical(game_map)

        else:
            try:
                game_map = Map.objects.get(id=map_id)
                game_map.data = request.POST['map_data']
            except Map.DoesNotExist:
                return HttpResponse(json.dumps({
                    'success': False,
                    'reason': "No map exists with given map id!"
                    }), mimetype='application/json')

        game_map.save()
        return HttpResponse(json.dumps({
            'success': True,
            'map_id' : game_map.id
            }), mimetype='application/json')
    else:
        pass # handle weird verbs


