import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class OnLoadRedirectMiddleware implements NestMiddleware {
  private isInitialLoad = true;

  use(req: Request, res: Response, next: NextFunction) {
    if (this.isInitialLoad) {
      this.isInitialLoad = false;
      return res.redirect('/auth/login');
    }
    next();
  }
}
