from django.shortcuts import get_object_or_404, render
from django.core.context_processors import csrf
from django.template import RequestContext
from django.http import HttpResponseRedirect, HttpResponse
from django.core.urlresolvers import reverse
from lobby.models import Map, Game
from django.contrib.auth.decorators import login_required

@login_required
def home(request):
    return render(request, 'lobby/home.html')

def logout(request):
    return render(request, 'lobby/logout.html')

@login_required
def index(request):
    #latest_map_list = Map.objects.all().order_by('-pub_date')[:5]
    #context = {'latest_map_list': latest_map_list}
    return render(request, 'lobby/index.html')

"""
@login_required
def detail(request, map_id):
    return HttpResponse("You're looking at map %s." % map_id)

@login_required
def results(request, map_id):
    return HttpResponse("You're looking at the results of map %s." % map_id)

@login_required
def vote(request, map_id):
    p = get_object_or_404(Map, pk=map_id)
    try:
        selected_choice = p.choice_set.get(pk=request.POST['choice'])
    except (KeyError, Choice.DoesNotExist):
        # Redisplay the map voting form.
        return render(request, 'lobby/detail.html', {
            'map': p,
            'error_message': "You didn't select a choice.",
        })
    else:
        selected_choice.votes += 1
        selected_choice.save()
        # Always return an HttpResponseRedirect after successfully dealing
        # with POST data. This prevents data from being posted twice if a
        # user hits the Back button.
        return HttpResponseRedirect(reverse('lobby:results', args=(p.id,)))
"""
