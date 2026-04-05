from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    if isinstance(exc, DjangoValidationError):
        if hasattr(exc, "message_dict"):
            details = exc.message_dict
        else:
            details = {"non_field_errors": list(exc.messages)}
        exc = DRFValidationError(detail=details)

    response = exception_handler(exc, context)

    if response is None:
        return None

    if isinstance(exc, DRFValidationError):
        details = response.data
        response.data = {
            "error": {
                "message": "Validation failed.",
                "details": details,
            }
        }
    else:
        message = response.data.get("detail", "An error occurred.")
        response.data = {
            "error": {
                "message": str(message),
            }
        }

    return response
