export class CmsError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export class ValidationError extends CmsError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends CmsError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ConflictError extends CmsError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class InternalError extends CmsError {
  constructor(message = "后台服务暂时不可用，请稍后重试。") {
    super(message, 500);
  }
}
