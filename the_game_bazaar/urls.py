from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.conf.urls import patterns, include, url
from the_game_bazaar import views
from jasmine_testing.views import tests
import lib.sdjango

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

lib.sdjango.autodiscover()

urlpatterns = patterns(
    '',
    url(r'^$',
        views.index,
        name="index"),

    url(r'^socket\.io', include(lib.sdjango.urls)),

    url(r'^home/$',
        views.home,
        name="home"),

    # User menu items
    url(r'^user/admin$',
        views.user_admin,
        name="user_admin"),

    url(r'^user/history$',
        views.user_history,
        name="user_history"),

    # Ajax Calls
    url(r'^ajax/lobby/$',
        views.ajax_lobby_games,
        name="ajax_lobby_games"),

    url(r'^ajax/maps/$',
        views.ajax_maps,
        name="ajax_maps"),

    url(r'^ajax/gravatar/$',
        views.ajax_gravatar,
        name="ajax_gravatar"),

    url(r'^ajax/history/$',
        views.ajax_history,
        name="ajax_history"),

    # Clan Calls
    url(r'^clan/create/$',
        views.create_clan,
        name="create_clan"),

    url(r'^clan/join/$',
        views.join_clan,
        name="join_clan"),

    url(r'^clan/leave/$',
        views.leave_clan,
        name="leave_clan"),

    # Loggin In, Registering, Loggin Out
    url(r'^login/$',
        views.login,
        name="login"),

    url(r'^auth/check/$',
        views.ajax_is_authenticated,
        name="ajax_is_authenticated"),
    
    url(r'^auth/login/$',
        views.ajax_login,
        name="ajax_login"),

    url(r'^auth/register/$',
        views.ajax_register,
        name="ajax_register"),

    url(r'^auth/logout/$',
        views.ajax_logout,
        name="ajax_logout"),

    url(r'^auth/change/$',
        views.ajax_change,
        name="ajax_change"),

    # Game related
    url(r'^edit/$',
        views.edit,
        name="edit"),

    url(r'^editor/', include('editor.urls')),
    url(r'^game/', include('game.urls')),

    # The testing modules
    url(r'^jasmine/$', tests, name="tests"),

    # Retrieving and saving maps
    url(r'^map/', include('lib.urls'))


    # Examples:
    # url(r'^$', 'the_game_bazaar.views.home', name='home'),
    # url(r'^the_game_bazaar/', include('the_game_bazaar.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
)

urlpatterns += staticfiles_urlpatterns()
