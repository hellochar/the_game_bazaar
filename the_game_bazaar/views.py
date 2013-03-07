from django.shortcuts import render


def index(request):
    context = {}
    return render(request, 'the_game_bazaar/chat.html', context)
