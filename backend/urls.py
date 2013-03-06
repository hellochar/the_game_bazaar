from django.conf.urls import patterns, url

from backend import views

urlpatterns = patterns('',
	url(r'^$', views.index, name='index')
	)