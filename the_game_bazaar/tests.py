from django.test import TestCase
from django.test.client import Client
from django.utils import simplejson as json
from the_game_bazaar import views
from django.contrib.auth.models import User


class SimpleTest(TestCase):
    def test_basic_addition(self):
        """
        Tests that 1 + 1 always equals 2.
        """
        self.assertEqual(1 + 1, 2)


class ourAuthTest(TestCase):
    def test_ajax_login(self):
        User.objects.create_user('aaa', 'aaa', 'aaa')
        req = {
            'method':'POST',
            'username':'aaa',
            'password':'aaa'
        }
        s_resp = views.ajax_login(req)
        self.assertEqual(json.loads(s_resp)['success'], True)