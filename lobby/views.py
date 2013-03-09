from django.http import HttpResponse
from django.utils import simplejson as json
from django.views.decorators.http import require_http_methods


@require_http_methods(["POST"])
def ajax_login(request):
    username = request.POST['username']
    password = request.POST['password']
    user = authenticate(username=username, password=password)

    resp = {
        "success":False,
    }
    if user is not None and user.is_active:
        # the password verified for the user
        resp['success'] = True

    return HttpResponse(json.dumps(resp), mimetype="application/json")