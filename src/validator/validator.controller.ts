import { Controller, Get, Logger } from "@nestjs/common";
import { ValidatorService } from "./validator.service";

@Controller("validate")
export class ValidatorController {
  private readonly logger = new Logger(ValidatorController.name);

  constructor(private readonly validatorService: ValidatorService) {}

  @Get()
  async validateWallets(): Promise<{ isApproved: boolean }> {
    this.logger.log("Received validation request");
    return this.validatorService.validateWallets();
  }

  @Get("/healthcheck")
  checkHealth(): string {
    this.logger.log("Received healthcheck request");
    return "OK";
  }
}
