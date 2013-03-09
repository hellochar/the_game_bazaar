from django.conf.urls import patterns, url
from game import views


urlpatterns = patterns('',
    url(r'host', views.host_game),
    url(r'join/(?P<num>\d+)/$', views.join_game),
    url(r'', views.socketio),
)
