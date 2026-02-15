from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.conf import settings
from django.contrib.auth import get_user_model
from jwt import decode as jwt_decode


@database_sync_to_async
def get_user_for_id(user_id):
    user_model = get_user_model()
    try:
        from rest_framework_simplejwt.settings import api_settings

        return user_model.objects.get(**{api_settings.USER_ID_FIELD: user_id})
    except user_model.DoesNotExist:
        from django.contrib.auth.models import AnonymousUser

        return AnonymousUser()


class JwtAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        scope = dict(scope)
        from django.contrib.auth.models import AnonymousUser

        scope["user"] = AnonymousUser()
        token = self._get_token(scope)
        if token:
            user = await self._get_user_from_token(token)
            scope["user"] = user
        return await super().__call__(scope, receive, send)

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
            from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
            from rest_framework_simplejwt.tokens import UntypedToken

            UntypedToken(token)
        except (InvalidToken, TokenError):
            from django.contrib.auth.models import AnonymousUser

            return AnonymousUser()

        try:
            from rest_framework_simplejwt.settings import api_settings

            payload = jwt_decode(
                token,
                settings.SECRET_KEY,
                algorithms=[api_settings.ALGORITHM],
            )
        except Exception:
            from django.contrib.auth.models import AnonymousUser

            return AnonymousUser()

        from rest_framework_simplejwt.settings import api_settings

        user_id = payload.get(api_settings.USER_ID_CLAIM)
        if not user_id:
            from django.contrib.auth.models import AnonymousUser

            return AnonymousUser()

        return await get_user_for_id(user_id)


def JwtAuthMiddlewareStack(inner):
    return JwtAuthMiddleware(inner)
