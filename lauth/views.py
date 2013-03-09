# Create your views here.
from django.shortcuts import render_to_response
from django.core.context_processors import csrf
from django.template import RequestContext
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db import IntegrityError
from django.utils import simplejson
import json
from django.http import HttpResponse
import os
import tempfile
import traceback
import re
import sys

#how to delete errything: User.objects.all().delete() 

def login_user(request):
    state = "Please log in below..."
    if request.POST:
        print request.POST
    username = password = ''
    if 'loginu' in request.POST:
        state = str(request.META.get('CONTENT_TYPE'))
        #return HttpResponse(simplejson.dumps("test"), mimetype='application/json')
        #return render_to_response('auth.html',{'state':state, 'username': username})
        username = request.POST.get('user')
        password = request.POST.get('password')

        user = authenticate(username=username, password=password)
        if user is not None:
            if user.is_active:
                login(request, user)
                user.last_name = int(user.last_name) + 1
                user.save()
                state = "You're successfully logged in, " + username +"! You've logged in this many times: " + str(user.last_name)
                return render_to_response('authres.html',{'state':state, 'username': username}, context_instance=RequestContext(request))
            else:
                state = "Not active."
        else:
            state = "Incorrect password or username"
    elif 'addu' in request.POST:
        username = request.POST.get('user')
        password = request.POST.get('password')
        if len(username) > 128 or len(username) == 0:
            state = "The user name should be non-empty and at most 128 characters long. Please try again."
        elif len(password) > 128:
            state = "The password should be at most 128 characters long. Please try again." 
        else:
            user = authenticate(username=username, password=password)
            if user is not None:
                state = "User already exists."
            else:
                try:
                    user = User.objects.create_user(username, '', password)
                    user.last_name = 1
                    user.save()
                    state = "Made an account for you, "+username+". You've logged in this many times: " + str(user.last_name)
                    user = authenticate(username=username, password=password)
                    login(request, user)
                    return render_to_response('authres.html',{'state':state, 'username': username}, context_instance=RequestContext(request))
                except IntegrityError:
                    state = "User exists already."
    elif 'logoutu' in request.POST:
        logout(request)
        state = "Logged out!"
    return render_to_response('auth.html',{'state': state, 'username': username}, context_instance=RequestContext(request))
