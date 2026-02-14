from rest_framework import permissions, viewsets

from documents.models import Document
from documents.serializers import DocumentSerializer
from documents.tasks import process_pdf


class DocumentViewSet(viewsets.ModelViewSet):
	serializer_class = DocumentSerializer
	permission_classes = [permissions.IsAdminUser]

	def get_queryset(self):
		return Document.objects.order_by("-created_at")

	def perform_create(self, serializer):
		document = serializer.save(uploaded_by=self.request.user)
		process_pdf.delay(document.id)
