from django.conf.urls import patterns, url
from game import views


urlpatterns = patterns('',
    url(r'host', views.host_game),
    url(r'join', views.join_game),
    url(r'userlist', views.user_list),
    url(r'', views.socketio),
)
