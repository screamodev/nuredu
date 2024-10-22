import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, ManyToMany} from 'typeorm';
import {User} from "../../users/entities/user.entity";
import {Material} from "../../materials/entities/material.entity";

@Entity()
export class Course {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    description: string;

    @ManyToOne(() => User, (user) => user.taughtCourses)
    teacher: User;

    @ManyToMany(() => User, (user) => user.courses)
    students: User[];  // Students enrolled in the course

    @OneToMany(() => Material, (material) => material.course)
    materials: Material[];
}
