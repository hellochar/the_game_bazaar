# forms.py
from django import forms


class GameForm(forms.Form):
    map_id = forms.IntegerField(required=True, min_value=0)
