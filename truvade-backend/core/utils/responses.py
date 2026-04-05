from rest_framework.response import Response


def success_response(message, data, status_code=200):
    return Response({"message": message, "data": data}, status=status_code)
