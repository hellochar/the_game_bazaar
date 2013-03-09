from django.contrib import admin
from lobby.models import Map
from lobby.models import Game

class GameInline(admin.StackedInline):
    model = Game
    extra = 3
	
	
class MapAdmin(admin.ModelAdmin):
    fieldsets = [
        (None,               {'fields': ['question']}),
        ('Date information', {'fields': ['pub_date'], 'classes': ['collapse']}),
    ]
    inlines = [GameInline]

admin.site.register(Map, MapAdmin)