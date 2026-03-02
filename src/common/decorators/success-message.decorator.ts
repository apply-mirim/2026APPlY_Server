import { SetMetadata } from '@nestjs/common';

export const SUCCESS_MESSAGE_KEY = 'successMessage';

export const SuccessMessage = (message: string | string[]) =>
  SetMetadata(
    SUCCESS_MESSAGE_KEY,
    Array.isArray(message) ? message : [message],
  );
