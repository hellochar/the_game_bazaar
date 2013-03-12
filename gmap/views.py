from django.http import HttpResponse
from django.utils import simplejson as json
from django.views.decorators.csrf import csrf_exempt
from gmap.models import Map

@csrf_exempt
def gmap(request):
    if request.method == 'GET':
        if 'map_id' not in request.GET:
            return HttpResponse(json.dumps({
                'success': False,
                'reason': "No map id supplied!"
                }), mimetype='application/json')

        try:
            game_map = Map.objects.get(id=request.GET['map_id'])
            return HttpResponse(json.dumps({
                'success': True, 
                'map_id' : game_map.id, 
                'map_data': json.loads(game_map.data)
                }), mimetype='application/json')
        except Map.DoesNotExist:
            return HttpResponse(json.dumps({
                'success': False,
                'reason': "No map exists with given map id!"
                }), mimetype='application/json')

    elif request.method == 'POST':
        if 'map_id' not in request.POST:
            creator_id = User.objects.get(pk=1) #TODO: make not bad
            num_players = 2 #uh oh
            map_name = "qwer"
            game_map = Map(
                    creator_id=creator_id,
                    num_players=num_players,
                    data=request.POST['map_data'],
                    map_name=map_name
                    )
        else:
            try:
                game_map = Map.objects.get(id=request.POST['map_id'])
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


