import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express'
import { AuthPayload } from './auth';

export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): AuthPayload => {
        const request = ctx.switchToHttp().getRequest<Request>()
        return request.user
    },
);