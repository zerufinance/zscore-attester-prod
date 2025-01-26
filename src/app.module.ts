import { Module } from '@nestjs/common';
import { ValidatorModule } from './validator/validator.module';

@Module({
  imports: [ValidatorModule],
})
export class AppModule {}
