from fastapi import Request, status
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger("bank_twin")


class BankTwinException(Exception):
    """Base exception for application domain errors."""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(BankTwinException):
    def __init__(self, entity: str, identifier: str):
        super().__init__(
            message=f"{entity} with id '{identifier}' not found.",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class PortfolioEmptyError(BankTwinException):
    def __init__(self):
        super().__init__(
            message="Loan portfolio is empty. Generate a synthetic bank first.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class SimulationError(BankTwinException):
    def __init__(self, detail: str):
        super().__init__(
            message=f"Simulation failed: {detail}",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )


class ValidationError(BankTwinException):
    def __init__(self, message: str):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )


async def bank_twin_exception_handler(request: Request, exc: BankTwinException):
    logger.error(f"Domain error [{exc.status_code}] on {request.url.path}: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.__class__.__name__,
            "message": exc.message,
            "path": request.url.path,
        },
    )


async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled server exception on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An internal server error occurred.",
            "path": request.url.path,
        },
    )
