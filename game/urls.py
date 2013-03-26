from django.conf.urls import patterns, url
from game import views


urlpatterns = patterns('',
    url(r'host',
        views.host_game,
        name="host"),

    url(r'join',
        views.join_game,
        name="join"),

    url(r'',
        views.socketio,
        name="socketio"),
)
