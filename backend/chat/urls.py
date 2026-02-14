from rest_framework.routers import DefaultRouter

from chat.views import ChatSessionViewSet

router = DefaultRouter()
router.register(r"sessions", ChatSessionViewSet, basename="chat-sessions")

urlpatterns = router.urls
