from django.shortcuts import render


def index(request):
    context = {}
    return render(request, 'the_game_bazaar/chat.html', context)

def list_games(request):
	context = {}
	return render(request, 'the_game_bazaar/games.html', context)

def host_game(request):
	context = {
		'isHost': True
	}
	return render(request, 'the_game_bazaar/game.html', context)

def join_game(request):
	context = {
		'isHost': False
	}
	return render(request, 'the_game_bazaar/game.html', context)