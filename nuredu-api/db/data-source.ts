import 'dotenv/config';
import {DataSource, DataSourceOptions} from "typeorm";
import {User} from "../src/users/entities/user.entity";
import {Role} from "../src/roles/entities/role.entity";
import {Course} from "../src/courses/entities/course.entity";
import {Material} from "../src/materials/entities/material.entity";

console.log(process.env.POSTGRES_HOST)

export const dataSourceOptions: DataSourceOptions = {
    type: "postgres",
    host:  `host.docker.internal`,
    port: +process.env.POSTGRES_HOST,
    username: `${process.env.POSTGRES_USER}`,
    password: `${process.env.POSTGRES_PASSWORD}`,
    database: `${process.env.POSTGRES_DB}`,
    entities: [User, Role, Course, Material],
    migrations: ['dist/db/migrations/*.js'],
    logging: true
}

const AppDataSource = new DataSource(dataSourceOptions)

export default AppDataSource;