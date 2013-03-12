from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.conf.urls import patterns, include, url
from the_game_bazaar import views
from gmap.views import gmap

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    url(r'^$', views.index),
    url(r'^socket.io/', include('game.urls')),
    url(r'^home/$', views.home),
    # Loggin In, Registering, Loggin Out
    url(r'^login/$', views.login),
    url(r'^auth/login/$', views.ajax_login),
    url(r'^auth/register/$', views.ajax_register),
    url(r'^auth/logout/$', views.ajax_logout),
    # Game related
    url(r'^play/$', views.play),
    url(r'^edit/$', views.edit),
    url(r'^editor/', include('editor.urls')),
    # url(r'^', 'lauth.views.login_user'),
    url(r'^game/', include('game.urls')),
    url(r'^map/$', gmap),
    # Examples:
    # url(r'^$', 'the_game_bazaar.views.home', name='home'),
    # url(r'^the_game_bazaar/', include('the_game_bazaar.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
)

urlpatterns += staticfiles_urlpatterns()
