export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string,
  ) {
    super(message);
  }

  static badRequest(message: string): AppError {
    return new AppError(400, message, "BAD_REQUEST");
  }

  static unauthorized(message: string): AppError {
    return new AppError(401, message, "UNAUTHORIZED");
  }

  static forbidden(message: string): AppError {
    return new AppError(403, message, "FORBIDDEN");
  }

  static notFound(message: string): AppError {
    return new AppError(404, message, "NOT_FOUND");
  }

  static badGateway(message: string): AppError {
    return new AppError(502, message, "BAD_GATEWAY");
  }

  static internal(message: string): AppError {
    return new AppError(500, message, "INTERNAL_ERROR");
  }
}
