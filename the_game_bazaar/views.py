from django.shortcuts import render


def index(request):
    context = {}
    return render(request, 'the_game_bazaar/chat.html', context)

def list_games(request):
	context = {}
	return render(request, 'the_game_bazaar/games.html', context)
