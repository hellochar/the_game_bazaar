from django.test import TestCase
from django.utils import simplejson as json
from the_game_bazaar import views
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.core.urlresolvers import reverse
from game.models import Game
from lib.models import Map


def login(client, username, password):
    s_resp = client.post(reverse('ajax_login'), {'username': username, 'password': password})
    resp_object = json.loads(s_resp.content)
    return resp_object


def register(client, username, password, email):
    s_resp = client.post(reverse('ajax_register'), {'username': username, 'password': password, 'email': email})
    resp_object = json.loads(s_resp.content)
    return resp_object


class playAjaxTest(TestCase):
    def test_ajax_lobby_games(self):
        User.objects.create_user('aaa', 'aaa', 'aaa')
        c = self.client
        login(c, 'aaa', 'aaa')

        s_resp = c.get(reverse('ajax_lobby_games'))
        resp_object = json.loads(s_resp.content)

        num = len(Game.get_games_in_state(Game.LOBBY))
        self.assertEqual(len(resp_object), num)

    def test_ajax_maps(self):
        User.objects.create_user('aaa', 'aaa', 'aaa')
        c = self.client
        login(c, 'aaa', 'aaa')

        s_resp = c.get(reverse('ajax_maps'))
        resp_object = json.loads(s_resp.content)

        num = len(Map.objects.all())
        self.assertEqual(len(resp_object), num)


class changeProfileTest(TestCase):
    def test_password_change_fail(self):
        User.objects.create_user('aaa', 'aaa', 'aaa')
        c = self.client
        login(c, 'aaa', 'aaa')

        s_resp = c.post(reverse('ajax_change'), {'old_pass': 'aba', 'new_pass': 'bbb'})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], False)
        self.assertEqual(resp_object['error'], 'The password is incorrect. Did you forget it?')

    def test_password_change_sucess(self):
        User.objects.create_user('aaa', 'aaa', 'aaa')
        c = self.client
        login(c, 'aaa', 'aaa')

        s_resp = c.post(reverse('ajax_change'), {'old_pass': 'aaa', 'new_pass': '12345678'})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], True)

        user = authenticate(username='aaa', password='12345678')
        self.assertEqual(user.username, 'aaa')

    def test_email_change(self):
        User.objects.create_user('aaa', 'aaa', 'aaa')
        c = self.client
        login(c, 'aaa', 'aaa')

        s_resp = c.post(reverse('ajax_change'), {'email': 'bbb@b.com'})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], True)
        user = authenticate(username='aaa', password='aaa')
        self.assertEqual(user.email, 'bbb@b.com')


class ourAuthTest(TestCase):
    def test_is_authenticated(self):
        User.objects.create_user('aaa', 'aaa', 'aaa')
        c = self.client
        login(c, 'aaa', 'aaa')

        s_resp = c.get(reverse('ajax_is_authenticated'))
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], True)


    def test_ajax_login_success(self):
        User.objects.create_user('aaa', 'aaa', 'aaa')
        c = self.client

        # test successful login
        resp_object = login(c, 'aaa', 'aaa')
        self.assertEqual(resp_object['success'], True)

    def test_ajax_login_user_dne(self):
        User.objects.create_user('aaa', 'aaa', 'aaa')
        c = self.client

        # test failed login
        resp_object = login(c, 'bbb', 'aaa')
        self.assertEqual(resp_object['success'], False)

    def test_ajax_login_bad_pass(self):
        User.objects.create_user('aaa', 'aaa', 'aaa')
        c = self.client

        # test failed login
        resp_object = login(c, 'aaa', 'bbb')
        self.assertEqual(resp_object['success'], False)

    def test_ajax_logout_success(self):
        User.objects.create_user('aaa', 'aaa', 'aaa')
        c = self.client
        # gotta login first
        resp_object = login(c, 'aaa', 'aaa')
        self.assertEqual(resp_object['success'], True)

        # now test logging out
        s_resp = c.post(reverse('ajax_logout'), {})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], True)

    def test_ajax_register_success(self):
        c = self.client
        resp_object = register(c, 'bbbb', '12345678', 'bbb@b.com')
        self.assertEqual(resp_object['success'], True)

        resp_object = login(c, 'bbbb', '12345678')
        self.assertEqual(resp_object['success'], True)

    def test_ajax_register_empty(self):
        c = self.client
        resp_object = register(c, '', '', '')
        self.assertEqual(resp_object['success'], False)
        self.assertEqual('error' in resp_object, True)

    def test_ajax_register_exists(self):
        c = self.client
        resp_object = register(c, 'aaaa', '12345678', 'bbb@b.com')
        self.assertEqual(resp_object['success'], True)

        resp_object = register(c, 'aaaa', '12345678', 'bbb@b.com')
        self.assertEqual(resp_object['success'], False)
        self.assertEqual('error' in resp_object, True)


class unauthorizedRedirectTest(TestCase):
    def test_play_redirect(self):
        c = self.client
        s_resp = c.get(reverse('lobbies_view'), follow=True)
        self.assertEqual(len(s_resp.redirect_chain), 1)

        User.objects.create_user('aaa', 'aaa', 'aaa')
        login(c, 'aaa', 'aaa')
        s_resp = c.get(reverse('lobbies_view'), follow=True)
        self.assertEqual(len(s_resp.redirect_chain), 0)

    def test_edit_redirect(self):
        c = self.client
        s_resp = c.get(reverse('edit'), follow=True)
        self.assertEqual(len(s_resp.redirect_chain), 1)

        User.objects.create_user('aaa', 'aaa', 'aaa')
        login(c, 'aaa', 'aaa')
        s_resp = c.get(reverse('edit'), follow=True)
        self.assertEqual(len(s_resp.redirect_chain), 0)

    def test_logout_redirect(self):
        c = self.client
        s_resp = c.post(reverse('ajax_logout'), {}, follow=True)
        self.assertEqual(len(s_resp.redirect_chain), 1)

class clanTest(TestCase):


    def test_create_non_existent_clan(self):
        User.objects.create_user('aaa', 'aaa', 'aaa')
        c = self.client
        login(c, 'aaa', 'aaa')

        s_resp = c.post(reverse('create_clan'), {'name': 'hello'})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], True)

    def test_create_existing_clan(self):
        User.objects.create_user('aaa', 'aaa', 'aaa')
        c = self.client
        login(c, 'aaa', 'aaa')

        # first create should be okay
        s_resp = c.post(reverse('create_clan'), {'name': 'hello'})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], True)

        # second create should NOT be okay
        s_resp = c.post(reverse('create_clan'), {'name': 'hello'})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], False)

    def test_join_existing_clan(self):
        User.objects.create_user('aaa', 'aaa', 'aaa')
        User.objects.create_user('bbb', 'bbb', 'bbb')
        c = self.client
        login(c, 'aaa', 'aaa')

        s_resp = c.post(reverse('create_clan'), {'name': 'hello'})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], True)

        d = self.client
        login(d, 'bbb', 'bbb')
        s_resp = c.post(reverse('join_clan'), {'name': 'hello'})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], True)


    def test_join_non_existing_clan(self):
        User.objects.create_user('aaa', 'aaa', 'aaa')
        c = self.client
        login(c, 'aaa', 'aaa')

        s_resp = c.post(reverse('join_clan'), {'name': 'hello'})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], False)

    def test_join_two_clans(self):
        User.objects.create_user('aaa', 'aaa', 'aaa')
        User.objects.create_user('bbb', 'bbb', 'bbb')
        c = self.client
        login(c, 'aaa', 'aaa')
        d = self.client
        login(d, 'bbb', 'bbb')

        s_resp = c.post(reverse('create_clan'), {'name': 'hello'})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], True)
        
        s_resp = d.post(reverse('create_clan'), {'name': 'world'})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], True)

        s_resp = c.post(reverse('join_clan'), {'name': 'world'})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], False)

    def test_leave_clan(self):
        User.objects.create_user('aaa', 'aaa', 'aaa')
        user = User.objects.get(username='aaa')
        c = self.client
        login(c, 'aaa', 'aaa')

        s_resp = c.post(reverse('create_clan'), {'name': 'hello'})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], True)

        self.assertEqual(user.groups.all().count(), 1)

        s_resp = c.post(reverse('leave_clan'), {'name': 'hello'})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], True)

        self.assertEqual(user.groups.all().count(), 0)

    def test_members_not_in_clan(self):
        User.objects.create_user('aaa', 'aaa', 'aaa')
        c = self.client
        login(c, 'aaa', 'aaa')

        s_resp = c.get(reverse('members_clan'))
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], False)
        self.assertEqual(resp_object['error'], "You are not part of a clan")

    def test_members_in_clan(self):
        User.objects.create_user('aaa', 'aaa', 'aaa')
        c = self.client
        login(c, 'aaa', 'aaa')

        s_resp = c.post(reverse('create_clan'), {'name': 'hello'})
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], True)

        s_resp = c.get(reverse('members_clan'))
        resp_object = json.loads(s_resp.content)
        self.assertEqual(resp_object['success'], True)
        self.assertEqual(resp_object['owner'], 'aaa')
        self.assertEqual(resp_object['data'], ['aaa'])
