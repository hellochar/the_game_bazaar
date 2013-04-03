from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.conf.urls import patterns, include, url
from the_game_bazaar import views
from lib.views import get_map
from jasmine_testing.views import tests

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    url(r'^$',
        views.index,
        name="index"),

    url(r'^socket.io/', include('game.urls')),

    url(r'^home/$',
        views.home,
        name="home"),
    
    # Play Ajax Calls
    url(r'^ajax/lobby/$',
        views.ajax_lobby_games,
        name="ajax_lobby_games"),

    url(r'^ajax/maps/$',
        views.ajax_maps,
        name="ajax_maps"),
    
    # Loggin In, Registering, Loggin Out
    url(r'^login/$',
        views.login,
        name="login"),

    url(r'^auth/login/$',
        views.ajax_login,
        name="ajax_login"),

    url(r'^auth/register/$',
        views.ajax_register,
        name="ajax_register"),

    url(r'^auth/logout/$',
        views.ajax_logout,
        name="ajax_logout"),

    # Game related
    url(r'^play/$',
        views.play,
        name="play"),

    url(r'^edit/$',
        views.edit,
        name="edit"),

    url(r'^editor/', include('editor.urls')),
    url(r'^game/', include('game.urls')),

    # The testing modules
    url(r'^jasmine/$', tests, name="tests"),

    # Retrieving and saving maps
    url(r'^map/$', get_map, name="get_map"),


    # Examples:
    # url(r'^$', 'the_game_bazaar.views.home', name='home'),
    # url(r'^the_game_bazaar/', include('the_game_bazaar.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
)

urlpatterns += staticfiles_urlpatterns()
