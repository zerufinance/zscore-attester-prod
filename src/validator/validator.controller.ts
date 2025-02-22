import { Body, Controller, Get, Logger, Post } from "@nestjs/common";
import { ValidatorService } from "./validator.service";

@Controller("task")
export class ValidatorController {
  private readonly logger = new Logger(ValidatorController.name);

  constructor(private readonly validatorService: ValidatorService) {}
  @Post("validate")
  async validateWallets(
    @Body("proofOfTask") proofOfTask: string
  ): Promise<{ data: boolean; error: boolean; message: string | null }> {
    this.logger.log("Received validation request");
    const res = await this.validatorService.validateWallets(proofOfTask);
    this.logger.log("Validation result: ", res);

    return res;
  }

  @Get("/healthcheck")
  checkHealth(): string {
    this.logger.log("Received healthcheck request");
    return "OK";
  }
}
