
from django.conf import settings
from django.contrib.auth.decorators import login_required
from re import compile


def handle_empty(url):
    if url == '':
        return r'^$'
    return url

EXEMPT_URLS = [compile(handle_empty(settings.LOGIN_URL.lstrip('/')))]
if hasattr(settings, 'LOGIN_EXEMPT_URLS'):
    EXEMPT_URLS += [compile(handle_empty(expr)) for expr in settings.LOGIN_EXEMPT_URLS]


class LoginRequiredMiddleware:
    """
    Middleware that requires a user to be authenticated to view any page other
    than LOGIN_URL. Exemptions to this requirement can optionally be specified
    in settings via a list of regular expressions in LOGIN_EXEMPT_URLS (which
    you can copy from your urls.py).

    Requires authentication middleware and template context processors to be
    loaded. You'll get an error if they aren't.

    The Login Required middleware requires authentication middleware to be
    installed. Edit your MIDDLEWARE_CLASSES setting to insert
    'django.contrib.auth.middleware.AuthenticationMiddleware'. If that doesn't
    work, ensure your TEMPLATE_CONTEXT_PROCESSORS setting includes
    'django.contrib.auth.context_processors.auth'.
    """
    def process_view(self, request, vfunc, vargs, vkwargs):
        # No need to process URLs if user already logged in
        if request.user.is_authenticated():
            return None

        path = request.path_info.lstrip('/')
        if not any(m.match(path) for m in EXEMPT_URLS):
            return login_required(function=vfunc, login_url=settings.LOGIN_URL, redirect_field_name=None)(request, *vargs, **vkwargs)

        # Explicitly return None for all non-matching requests
        return None
