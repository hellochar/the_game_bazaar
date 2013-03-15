from django.shortcuts import render


def tests(request):
    context = {
    }
    return render(request, 'jasmine_testing/specrunner.html', context)
