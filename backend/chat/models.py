from django.conf import settings
from django.db import models


class ChatSession(models.Model):
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"Session {self.id}"


class Message(models.Model):
	ROLE_USER = "user"
	ROLE_ASSISTANT = "assistant"

	ROLE_CHOICES = [
		(ROLE_USER, "User"),
		(ROLE_ASSISTANT, "Assistant"),
	]

	session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name="messages")
	role = models.CharField(max_length=20, choices=ROLE_CHOICES)
	content = models.TextField()
	timestamp = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["timestamp"]

	def __str__(self):
		return f"{self.role}: {self.content[:40]}"
