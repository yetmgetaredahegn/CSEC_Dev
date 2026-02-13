from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.conf import settings
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import UntypedToken
from jwt import decode as jwt_decode


@database_sync_to_async
def get_user_for_id(user_id):
    user_model = get_user_model()
    try:
        return user_model.objects.get(**{api_settings.USER_ID_FIELD: user_id})
    except user_model.DoesNotExist:
        return AnonymousUser()


class JwtAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    def __call__(self, scope):
        return JwtAuthMiddlewareInstance(scope, self.inner)


class JwtAuthMiddlewareInstance:
    def __init__(self, scope, inner):
        self.scope = dict(scope)
        self.inner = inner

    async def __call__(self, receive, send):
        self.scope["user"] = AnonymousUser()
        token = self._get_token(self.scope)
        if token:
            user = await self._get_user_from_token(token)
            self.scope["user"] = user
        return await self.inner(self.scope, receive, send)

    def _get_token(self, scope):
        query_string = scope.get("query_string", b"").decode("utf-8")
        if query_string:
            params = parse_qs(query_string)
            if "token" in params and params["token"]:
                return params["token"][0]

        headers = {key.decode("latin1"): value.decode("latin1") for key, value in scope.get("headers", [])}
        auth_header = headers.get("authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            return auth_header.split(" ", 1)[1].strip()

        return None

    async def _get_user_from_token(self, token):
        try:
            UntypedToken(token)
        except (InvalidToken, TokenError):
            return AnonymousUser()

        try:
            payload = jwt_decode(
                token,
                settings.SECRET_KEY,
                algorithms=[api_settings.ALGORITHM],
            )
        except Exception:
            return AnonymousUser()

        user_id = payload.get(api_settings.USER_ID_CLAIM)
        if not user_id:
            return AnonymousUser()

        return await get_user_for_id(user_id)


def JwtAuthMiddlewareStack(inner):
    return JwtAuthMiddleware(inner)
