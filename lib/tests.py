from django.test import TestCase
from django.core.urlresolvers import reverse
from django.contrib.auth.models import User
from lib.models import Map
import json


def createUser():
    User.objects.create_user("tester", "tester", "tester")


def createTestMap():
    Map.objects.create(
        creator=User.objects.get(username="tester"),
        num_players=2,
        data='{"players":[{"id":0,"units":[]},{"id":1,"units":[]}]}',
        map_name="qwer"
    )


class MapTester(TestCase):
    def setUp(self):
        createUser()
        createTestMap()
        self.client.login(username="tester", password="tester")

    #returns (response, body parsed to JSON)
    def make_GET(self, map_id=None):
        if map_id is None:
            map_id = Map.objects.all()[0].id
        response = self.client.get(reverse("get_map"), {"map_id": map_id})
        return (response, json.loads(response.content))

    def make_POST(self, map_data, map_id=None):
        if map_id is None:
            map_id = Map.objects.all()[0].id

        params = {'map_id': map_id, 'map_data': map_data}
        response = self.client.post(reverse('get_map'), params)
        return (response, json.loads(response.content))


class MapGETTester(MapTester):

    def test_get_map_data_is_string(self):
        self.make_GET()

    def test_successfully_get_map(self):
        map_id = Map.objects.all()[0].id
        _, response_json = self.make_GET()
        self.assertTrue(response_json['success'])
        self.assertEquals(map_id, response_json['map_id'])
        self.assertDictEqual({"players": [{"id": 0, "units": []}, {"id": 1, "units": []}]}, json.loads(response_json['map_data']))

    def test_json_mimetype(self):
        response, _ = self.make_GET()
        self.assertEquals('application/json', response._headers['content-type'][1])

    def test_nonexistent_map(self):
        _, json = self.make_GET(-1)  # bad map id
        self.assertFalse(json["success"])

    def test_no_map_id_parameter(self):
        response = self.client.get(reverse("get_map"), {})
        self.assertFalse(json.loads(response.content)['success'])


class MapPOSTTester(MapTester):

    def test_successfully_post_new_map(self):
        map_data = "{'players': [{'id':0,'units':[]}, {'id':1,'units':[]}]}"
        response_json = json.loads(self.client.post(reverse("get_map"), {'map_data': map_data}).content)
        self.assertTrue(response_json["success"])
        self.assertEqual(map_data, Map.objects.get(id=response_json['map_id']).data)
        # import code
        # code.interact(local=locals())

    def test_successfully_post_existing_map(self):
        _, json = self.make_POST("{'foo' : 'bar'}")
        self.assertTrue(json["success"])

    def test_nonexistent_map(self):
        _, json = self.make_POST("{'foo' : 'bar'}", -1)
        self.assertFalse(json["success"])

    def test_post_map_and_then_get_data(self):
        map_id = Map.objects.all()[0].id
        self.make_POST("{'foo':'bar'}", map_id)
        response, json = self.make_GET(map_id)
        self.assertDictEqual(
            {
                'success': True,
                'map_id': map_id,
                'map_data': "{'foo':'bar'}",
            },
            json
        )

    def test_json_mimetype(self):
        pass
