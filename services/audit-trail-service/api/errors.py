"""Centralized API error handling."""

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger("audit-trail-service")


def _request_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


def _error_response(
    request: Request,
    *,
    status_code: int,
    error: str,
    detail: str,
    extra: dict[str, Any] | None = None,
) -> JSONResponse:
    request_id = _request_id(request)
    payload: dict[str, Any] = {
        "error": error,
        "detail": detail,
        "path": request.url.path,
    }
    if request_id:
        payload["request_id"] = request_id
    if extra:
        payload.update(extra)

    response = JSONResponse(status_code=status_code, content=payload)
    if request_id:
        response.headers["X-Request-ID"] = request_id
    return response


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    logger.info(
        "Validation error on %s %s: %s",
        request.method,
        request.url.path,
        exc.errors(),
    )
    return _error_response(
        request,
        status_code=422,
        error="validation_error",
        detail="Request validation failed.",
        extra={"errors": jsonable_encoder(exc.errors())},
    )


async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    logger.error(
        "Database error on %s %s",
        request.method,
        request.url.path,
        exc_info=True,
    )
    return _error_response(
        request,
        status_code=503,
        error="database_unavailable",
        detail="The audit database is temporarily unavailable.",
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(
        "Unhandled error on %s %s",
        request.method,
        request.url.path,
        exc_info=True,
    )
    return _error_response(
        request,
        status_code=500,
        error="internal_server_error",
        detail="An unexpected server error occurred.",
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
