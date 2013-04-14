from django.conf.urls import patterns, url
from game.views import LobbiesView, GameView

urlpatterns = patterns(
    '',
    url(r'(?P<gameid>.+)$',
        GameView.as_view(),
        name="game_view"),
    url(r'$',
        LobbiesView.as_view(),
        name="lobbies_view")

)
