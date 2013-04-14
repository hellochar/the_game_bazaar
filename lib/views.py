from django.http import HttpResponse
from django.utils import simplejson as json
from django.views.decorators.csrf import csrf_exempt
from lib.models import Map
from django.views.generic import View

# from django.contrib.auth.models import User


def json_response(response_data):
    return HttpResponse(json.dumps(response_data), content_type="application/json")


class MapView(View):
    """
    Handles all requests that go to /map/#mapid
    """

    http_method_names = ['get', 'post', 'options']

    # This is how you add a decorator to a class-based view
    @csrf_exempt
    def dispatch(self, *args, **kwargs):
        return super(MapView, self).dispatch(*args, **kwargs)

    def get(self, request, mapid):
        try:
            mapid = int(mapid)
        except ValueError:
            return json_response({
                'success': False,
                'reason': "No map exists with given map id!"
            })

        try:
            game_map = Map.objects.get(id=mapid)
            return json_response({
                'success': True,
                'map_id': game_map.id,
                'map_data': game_map.data,  # send the string
            })

        except Map.DoesNotExist:
            return json_response({
                'success': False,
                'reason': "No map exists with given map id!"
            })

    def post(self, request, mapid):
        try:
            mapid = int(mapid)
        except ValueError:
            return json_response({
                'success': False,
                'reason': "No map exists with given map id!"
            })

        try:
            game_map = Map.objects.get(id=mapid)
            game_map.data = request.POST['map_data']
        except Map.DoesNotExist:
            return json_response({
                'success': False,
                'reason': "No map exists with given map id!"
            })

        game_map.save()
        return json_response({
            'success': True,
            'map_id': game_map.id
        })


class NewMapView(View):
    """
    Handles all requests that go to /map/
    """

    http_method_names = ['get', 'post', 'options']

    @csrf_exempt
    def dispatch(self, *args, **kwargs):
        return super(NewMapView, self).dispatch(*args, **kwargs)

    def get(self, request):
        return json_response({
            'success': False,
            'reason': "No map id supplied!"
        })

    def post(self, request):
        creator = request.user
        num_players = 2  # uh oh
        map_name = "qwer"
        game_map = Map(
            creator=creator,
            num_players=num_players,
            data=request.POST['map_data'],  # gets stored as a string
            map_name=map_name
        )

        game_map.save()
        return json_response({
            'success': True,
            'map_id': game_map.id
        })
