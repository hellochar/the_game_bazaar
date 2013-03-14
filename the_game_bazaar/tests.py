from django.test import TestCase
from django.test.client import Client


class SimpleTest(TestCase):
    def test_basic_addition(self):
        """
        Tests that 1 + 1 always equals 2.
        """
        self.assertEqual(1 + 1, 2)


class Authtest(TestCase):
	def test_ajax_login(self):
        User.objects.create_user(username, email, password)
		req = {
            'username':'aaa'
            'password':'aaa'
		}

	def test_ajax_register(self):

	def test_ajax_logout(self):