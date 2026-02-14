from rest_framework import serializers

from documents.models import Document


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            "id",
            "title",
            "file",
            "uploaded_by",
            "processed",
            "created_at",
        ]
        read_only_fields = ["uploaded_by", "processed", "created_at"]

    def validate_file(self, value):
        if not value.name.lower().endswith(".pdf"):
            raise serializers.ValidationError("Only PDF files are allowed.")

        max_size_mb = 20
        if value.size > max_size_mb * 1024 * 1024:
            raise serializers.ValidationError("File size must be under 20MB.")

        return value
