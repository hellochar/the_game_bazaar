from django.shortcuts import render


# /
def index(request):
    context = {}
    return render(request, 'the_game_bazaar/chat.html', context)


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


# /game/host
def host_game(request):
    context = {
        'isHost': True
    }
    return render(request, 'the_game_bazaar/game.html', context)


# /game/join
def join_game(request):
    context = {
        'isHost': False
    }
    return render(request, 'the_game_bazaar/game.html', context)
