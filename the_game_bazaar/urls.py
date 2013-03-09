from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.conf.urls import patterns, include, url
from the_game_bazaar import views

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    url(r'^$', views.index),
    url(r'^lobby/', include('lobby.urls', namespace="lobby")),
    url(r'^', 'lauth.views.login_user'),
    url(r'^list/', views.list_games),
    url(r'^socket.io/', include('game.urls'))
    # Examples:
    # url(r'^$', 'the_game_bazaar.views.home', name='home'),
    # url(r'^the_game_bazaar/', include('the_game_bazaar.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
)

urlpatterns += staticfiles_urlpatterns()
