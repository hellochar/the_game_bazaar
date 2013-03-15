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
        c = Client()

        # test successful login
        s_resp = c.post('/auth/login/', {'username':'aaa', 'password':'aaa'})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], True)

        # test failed login
        s_resp = c.post('/auth/login/', {'username':'bbb', 'password':'aaa'})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], False)

    def test_ajax_logout(self):
        User.objects.create_user('aaa', 'aaa', 'aaa')
        c = Client()
        s_resp = c.post('/auth/login/', {'username':'aaa', 'password':'aaa'})
        resp_object = json.loads(s_resp.content)
        s_resp = c.post('/auth/logout/', {})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], True)