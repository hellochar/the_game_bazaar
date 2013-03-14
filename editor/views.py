# Create your views here.
from django.shortcuts import render
from game.models import Game

def index(request):
    context = {
    }
    return render(request, 'editor/editor.html', context)
