import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type AdminContext = {
  username: string;
};

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminContext | null => {
    const request = ctx.switchToHttp().getRequest<{ admin?: AdminContext }>();
    return request.admin ?? null;
  },
);
