export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly isOperational = true,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} introuvable`, "NOT_FOUND", 404);
  }
}

export class ValidationError extends AppError {
  constructor(public readonly details: Record<string, string>) {
    super("Données invalides", "VALIDATION_ERROR", 422);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentification requise") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
  }
}
