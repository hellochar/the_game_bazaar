"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from django.test import TestCase
from django.core.urlresolvers import reverse
from django.contrib.auth.models import User
from gmap.models import Map

def createUser():
    User.objects.create_user("tester", "tester", "tester")

def createTestMap():
    Map.objects.create(
                    creator_id = "tester",
                    num_players = 2,
                    data = {},
                    map_name = "qwer"
                    )


class MapTester(TestCase):
    def test_get_map(self):
        """
        Test getting the first map
        """
        createUser()
        createTestMap()
        response = self.client.get(reverse("gmap"))
        self.assert(response.status_code, 200)
        # fill in more tests here

    def test_post_map(self):
        """
        Test saving the map to the server
        """
        # actually post test map data
        response = self.client.post(reverse("gmap"))

