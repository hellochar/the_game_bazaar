from django.conf.urls import patterns, url

from lobby import views

urlpatterns = patterns('',
    url(r'^login', views.ajax_login),
    #url(r'^(?P<map_id>\d+)/$', views.detail, name='detail'),
    #url(r'^(?P<map_id>\d+)/results/$', views.results, name='results'),
    #url(r'^(?P<map_id>\d+)/vote/$', views.vote, name='vote'),
)
