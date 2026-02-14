import json
import time
from collections import deque

from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.conf import settings
from openai import AsyncOpenAI

from chat.models import ChatSession, Message
from rag.prompts import SYSTEM_PROMPT
from rag.retrieval import retrieve_context


class ChatConsumer(AsyncWebsocketConsumer):
    RATE_LIMIT_WINDOW_SECONDS = 30
    RATE_LIMIT_MAX_MESSAGES = 6

    async def connect(self):
        if self.scope["user"].is_anonymous:
            await self.close(code=4401)
            return

        self._message_times = deque()
        await self.accept()
        await self.send(text_data=json.dumps({"type": "status", "message": "connected"}))

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            await self.send(text_data=json.dumps({"type": "error", "error": "empty_payload"}))
            return

        try:
            payload = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({"type": "error", "error": "invalid_json"}))
            return

        if self._is_rate_limited():
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "error",
                        "error": "rate_limited",
                        "retry_after": self.RATE_LIMIT_WINDOW_SECONDS,
                    }
                )
            )
            return

        message = str(payload.get("message", "")).strip()
        if not message:
            await self.send(text_data=json.dumps({"type": "error", "error": "empty_message"}))
            return

        if not settings.OPENAI_API_KEY:
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "error",
                        "error": "missing_openai_key",
                    }
                )
            )
            return

        session_id = payload.get("session_id")
        session = await self._get_or_create_session(session_id)
        user_message = await self._create_message(session, Message.ROLE_USER, message)
        history = await self._get_recent_messages(session, exclude_id=user_message.id)

        context_chunks = await sync_to_async(retrieve_context)(message)
        context_block = "\n\n".join(context_chunks) if context_chunks else ""
        history_block = "\n".join(
            f"{item.role}: {item.content}" for item in history
        )

        system_message = SYSTEM_PROMPT
        if context_block:
            system_message = f"{system_message}\n\nContext:\n{context_block}"
        if history_block:
            system_message = f"{system_message}\n\nConversation history:\n{history_block}"

        await self.send(
            text_data=json.dumps(
                {
                    "type": "session",
                    "session_id": session.id,
                }
            )
        )

        await self._stream_answer(session, system_message, message)

    async def _stream_answer(self, session, system_message, message):
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        assistant_text = ""

        try:
            stream = await client.chat.completions.create(
                model=settings.OPENAI_CHAT_MODEL,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": message},
                ],
                stream=True,
            )

            async for event in stream:
                delta = event.choices[0].delta.content or ""
                if delta:
                    assistant_text += delta
                    await self.send(
                        text_data=json.dumps(
                            {
                                "type": "delta",
                                "content": delta,
                            }
                        )
                    )
        except Exception:
            await self.send(
                text_data=json.dumps(
                    {
                        "type": "error",
                        "error": "stream_failed",
                    }
                )
            )
            return

        if assistant_text:
            await self._create_message(session, Message.ROLE_ASSISTANT, assistant_text)
            await self.send(text_data=json.dumps({"type": "done"}))

    @database_sync_to_async
    def _get_or_create_session(self, session_id):
        if session_id:
            try:
                return ChatSession.objects.get(id=session_id, user=self.scope["user"])
            except ChatSession.DoesNotExist:
                pass
        return ChatSession.objects.create(user=self.scope["user"])

    @database_sync_to_async
    def _create_message(self, session, role, content):
        return Message.objects.create(session=session, role=role, content=content)

    @database_sync_to_async
    def _get_recent_messages(self, session, exclude_id=None, limit=5):
        queryset = Message.objects.filter(session=session)
        if exclude_id:
            queryset = queryset.exclude(id=exclude_id)
        return list(queryset.order_by("-timestamp")[:limit][::-1])

    def _is_rate_limited(self):
        now = time.monotonic()
        window_start = now - self.RATE_LIMIT_WINDOW_SECONDS
        while self._message_times and self._message_times[0] < window_start:
            self._message_times.popleft()

        if len(self._message_times) >= self.RATE_LIMIT_MAX_MESSAGES:
            return True

        self._message_times.append(now)
        return False
