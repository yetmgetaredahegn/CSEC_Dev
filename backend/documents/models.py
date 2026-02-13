from django.conf import settings
from django.db import models


class Document(models.Model):
	title = models.CharField(max_length=255)
	file = models.FileField(upload_to="pdfs/")
	uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
	processed = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return self.title
