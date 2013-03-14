from django.test import TestCase
from django.core.urlresolvers import reverse
from django.contrib.auth.models import User
from gmap.models import Map


def createUser():
    User.objects.create_user("tester", "tester", "tester")


def createTestMap():
    Map.objects.create(
        creator_id=User.objects.get(username="tester"),
        num_players=2,
        data={},
        map_name="qwer"
    )


class MapTester(TestCase):
    def setUp(self):
        createUser()
        createTestMap()

    def test_get_map(self):
        """
        Test getting the first map
        """
        response = self.client.get(reverse("gmap"), {"map_id": 1})
        self.assertEquals(response.status_code, 200)
        # fill in more tests here

    def test_post_map(self):
        """
        Test saving the map to the server
        """
        # actually post test map data
        response = self.client.post(reverse("gmap"), {"map_id": 1, "map_data": "{}"})
        self.assertEquals(response.status_code, 200)
