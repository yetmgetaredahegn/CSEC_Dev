from rest_framework import permissions, viewsets

from chat.models import ChatSession
from chat.serializers import ChatSessionDetailSerializer, ChatSessionListSerializer


class ChatSessionViewSet(viewsets.ReadOnlyModelViewSet):
	permission_classes = [permissions.IsAuthenticated]

	def get_queryset(self):
		return ChatSession.objects.filter(user=self.request.user).order_by("-created_at")

	def get_serializer_class(self):
		if self.action == "retrieve":
			return ChatSessionDetailSerializer
		return ChatSessionListSerializer
