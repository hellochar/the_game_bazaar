"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from django.test import TestCase
import json

class UserListTests(TestCase):
    def test_userlist(self):
        """
        Test user list to see if the correct response is returned
        """
        self.assertEqual(1 + 1, 2)
