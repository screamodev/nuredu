import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Course } from "../../courses/entities/course.entity";

@Entity()
export class Material {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  content: string; // Could be a file path or text

  @ManyToOne(() => Course, (course) => course.materials)
  course: Course;
}
