from rest_framework import serializers

from chat.models import ChatSession, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "role", "content", "timestamp"]


class ChatSessionListSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = ["id", "created_at", "last_message"]

    def get_last_message(self, obj):
        message = obj.messages.order_by("-timestamp").first()
        if not message:
            return None
        return MessageSerializer(message).data


class ChatSessionDetailSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = ["id", "created_at", "messages"]
