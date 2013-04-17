from django.conf.urls import patterns, url
from game.views import LobbiesView, GameView

urlpatterns = patterns(
    '',
    # Route requests that go to /game/<gameid>
    url(r'(?P<gameid>.+)$',
        GameView.as_view(),
        name="game_view"),
    # Route requests with no <gameid>
    url(r'$',
        LobbiesView.as_view(),
        name="lobbies_view")

)
