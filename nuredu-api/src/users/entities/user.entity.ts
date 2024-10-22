import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  JoinTable,
  ManyToMany,
} from "typeorm";
import { Role } from "../../roles/entities/role.entity";
import { Course } from "../../courses/entities/course.entity";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  password: string;

  @ManyToMany(() => Course, (course) => course.students)
  @JoinTable() // This creates a join table to track which users (students) are enrolled in which courses
  courses: Course[];

  @OneToMany(() => Course, (course) => course.teacher)
  taughtCourses: Course[]; // Courses taught by this user (if teacher)

  @ManyToMany(() => Role)
  @JoinTable()
  roles: Role[];
}
