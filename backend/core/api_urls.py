from django.urls import include, path

from core.views import ping

urlpatterns = []
urlpatterns += [
	path('ping/', ping, name='ping'),
	path('documents/', include('documents.urls')),
	path('chat/', include('chat.urls')),
]
