import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './modules/users/users.module';
import { DatabaseModule } from './config/database.module';

@Module({
  imports: [
    // Load environment variables globally
    ConfigModule.forRoot({ isGlobal: true }),

    // Database connection via Sequelize + PostgreSQL
    DatabaseModule,

    UsersModule,

    // Feature module for products (buy/sell used products)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
