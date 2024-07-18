import { Logger, Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger extends Logger {
  setContext = (context: string) => {
    this.context = context;
  };

  log = (message: string, data?: any) => {
    const timestamp = Date.now();
    if (data) {
      super.log(`[${timestamp}] ${message}`, data);
    } else {
      super.log(`[${timestamp}] ${message}`);
    }
  };

  error = (message: string, data?: any) => {
    const timestamp = Date.now();
    if (data) {
      super.error(`[${timestamp}] ${message}`, data);
    } else {
      super.error(`[${timestamp}] ${message}`);
    }
  };

  warn = (message: string, data?: any) => {
    const timestamp = Date.now();
    if (data) {
      super.warn(`[${timestamp}] ${message}`, data);
    } else {
      super.warn(`[${timestamp}] ${message}`);
    }
  };

  debug = (message: string, data?: any) => {
    const timestamp = Date.now();
    if (data) {
      super.debug(`[${timestamp}] ${message}`, data);
    } else {
      super.debug(`[${timestamp}] ${message}`);
    }
  };

  verbose = (message: string, data?: any) => {
    const timestamp = Date.now();
    if (data) {
      super.verbose(`[${timestamp}] ${message}`, data);
    } else {
      super.verbose(`[${timestamp}] ${message}`);
    }
  };
}
