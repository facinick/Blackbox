import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Redirect,
  Req,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async initialize() {
    await this.appService.initialize();
  }
}
