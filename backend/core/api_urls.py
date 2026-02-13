from django.urls import include, path

urlpatterns = []
urlpatterns += [
	path('documents/', include('documents.urls')),
	path('chat/', include('chat.urls')),
]
