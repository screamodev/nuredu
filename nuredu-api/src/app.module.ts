import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CoursesModule } from "./courses/courses.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import {TypeOrmModule} from "@nestjs/typeorm";
import {dataSourceOptions} from "../db/data-source";
import {ConfigModule} from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    CoursesModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
