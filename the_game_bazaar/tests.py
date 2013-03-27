from django.test import TestCase
from django.utils import simplejson as json
from the_game_bazaar import views
from django.contrib.auth.models import User



def login(client, username, password):
    s_resp = client.post('/auth/login/', {'username':username, 'password':password})
    resp_object = json.loads(s_resp.content)
    return resp_object

class ourAuthTest(TestCase):
    def test_ajax_login_success(self):
        User.objects.create_user('aaa', 'aaa', 'aaa')
        c = self.client

        # test successful login
        s_resp = c.post('/auth/login/', {'username':'aaa', 'password':'aaa'})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], True)

    def test_ajax_login_fail(self):
        User.objects.create_user('aaa', 'aaa', 'aaa')
        c = self.client

        # test failed login
        s_resp = c.post('/auth/login/', {'username':'bbb', 'password':'aaa'})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], False)

    def test_ajax_logout_success(self):
        User.objects.create_user('aaa', 'aaa', 'aaa')
        c = self.client
        # gotta login first
        s_resp = c.post('/auth/login/', {'username':'aaa', 'password':'aaa'})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], True)

        # now test logging out
        s_resp = c.post('/auth/logout/', {})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], True)

    def test_ajax_register_success(self):
        c = self.client
        s_resp = c.post('/auth/register/', {'username':'bbb', 'password':'bbb', 'email':'bbb'})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], True)

        resp_object = login(c, 'bbb', 'bbb')
        self.assertEqual(resp_object['success'], True)

    def test_ajax_register_empty(self):
        c = self.client
        s_resp = c.post('/auth/register/', {'username':'', 'password':'', 'email':''})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], False)
        self.assertEqual('error' in resp_object, True)

    def test_ajax_register_exists(self):
        c = self.client
        s_resp = c.post('/auth/register/', {'username':'aaa', 'password':'bbb', 'email':'bbb'})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], True)

        s_resp = c.post('/auth/register/', {'username':'aaa', 'password':'bbb', 'email':'bbb'})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], False)
        self.assertEqual('error' in resp_object, True)

class unauthorizedRedirectTest(TestCase):
    def test_play_redirect(self):
        c = self.client
        s_resp = c.get('/play/', follow=True)
        self.assertEqual(len(s_resp.redirect_chain), 1)

        User.objects.create_user('aaa', 'aaa', 'aaa')
        login(c, 'aaa', 'aaa')
        s_resp = c.get('/play/', follow=True)
        self.assertEqual(len(s_resp.redirect_chain), 0)

    def test_edit_redirect(self):
        c = self.client
        s_resp = c.get('/edit/', follow=True)
        self.assertEqual(len(s_resp.redirect_chain), 1)

        User.objects.create_user('aaa', 'aaa', 'aaa')
        login(c, 'aaa', 'aaa')
        s_resp = c.get('/edit/', follow=True)
        self.assertEqual(len(s_resp.redirect_chain), 0)

    def test_logout_redirect(self):
        c = self.client
        s_resp = c.post('/auth/logout/', {}, follow=True)
        self.assertEqual(len(s_resp.redirect_chain), 1)
