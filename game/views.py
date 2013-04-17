import logging

from django.http import HttpResponse, Http404

from django.views.generic import View
from django.shortcuts import render, redirect
from django.core.urlresolvers import reverse
from lib.models import Map
from game.models import Game
from game.forms import GameForm
import json


class LobbiesView(View):
    """
    Handles all requests that go to /game/
    """

    http_method_names = ['get', 'post', 'options']

    # GET /game/
    def get(self, request):
        """ Gets the list of all games in the LOBBY state """

        game_list = []
        games = Game.get_games_in_state(Game.LOBBY).order_by('id').reverse()
        for game in games:
            game_list.append(game.to_map())

        map_list = []
        maps = Map.objects.all()
        for a_map in maps:
            map_list.append(a_map.to_map())
        context = {
            "maps": map_list,
            "games": game_list,
        }
        return render(request, 'the_game_bazaar/play.html', context)

    # POST /game/
    def post(self, request):
        """ Create a new game """

        form = GameForm(request.POST)
        if form.is_valid():
            game, players_json = Game.create_new_game(form.cleaned_data['map_id'], request.user)
            # Render the context with our parameters.
            return redirect(reverse('game_view', kwargs={'gameid': game.id}))
        else:
            # Needs better error handling
            raise Http404


class GameView(View):
    """
    Handles all requests that go to /game/<gameid>
    """

    http_method_names = ['get', 'options']

    # GET /game/<gameid>
    def get(self, request, gameid):
        """ Get the page for game <gameid> and join the player to the game """
        try:
            gameid = int(gameid)
        except ValueError:
            raise Http404
        # TODO: if the game_id is empty, you should display an error!
        game, players_json, player_id = Game.add_user_to_game(gameid, request.user)

            # Render the context with our parameters.
        context = {
            'isHost': player_id == 0,
            'game_id': game.id,
            'map_id': game.map.id,
            'players_json': [(k, v) for k, v in enumerate(players_json)],
            'player_id': player_id
        }
        return render(request, 'game/game.html', context)
