from django.db import models
from django.contrib.auth.models import Group, User

class Clan(Group):

    creator = models.ForeignKey(User)