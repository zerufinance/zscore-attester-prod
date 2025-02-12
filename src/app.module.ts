import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ValidatorModule } from './validator/validator.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ValidatorModule,
  ],
})
export class AppModule {}
