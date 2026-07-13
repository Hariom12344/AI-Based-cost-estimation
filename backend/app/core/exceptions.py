class AppError(Exception):
    """Base error class for the application."""
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code

class AuthenticationError(AppError):
    """Raised when authentication fails."""
    def __init__(self, message: str = "Invalid credentials"):
        super().__init__(message, status_code=401)

class UserAlreadyExistsError(AppError):
    """Raised when attempting to register an existing username or email."""
    def __init__(self, message: str = "User already exists"):
        super().__init__(message, status_code=400)

class NotFoundError(AppError):
    """Raised when a requested resource is not found."""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=404)

class PermissionDeniedError(AppError):
    """Raised when a user lacks required permissions."""
    def __init__(self, message: str = "Permission denied"):
        super().__init__(message, status_code=403)
