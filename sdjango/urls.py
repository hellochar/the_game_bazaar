from django.conf.urls import patterns, url
from sdjango import views

urlpatterns = patterns('',

	url("", views.socketio, name='socketio')
	)
