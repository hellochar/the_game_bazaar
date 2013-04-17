from django.conf.urls import patterns, url
from lib.views import MapView, NewMapView

urlpatterns = patterns(
    '',
    url(r'(?P<mapid>.+)$',
        MapView.as_view(),
        name="map_view"),
    url(r'$',
        NewMapView.as_view(),
        name="new_map_view"
        )
)
