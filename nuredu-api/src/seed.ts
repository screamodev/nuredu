import AppDataSource from "../db/data-source";
import { Role } from "./roles/entities/role.entity";
import { User } from "./users/entities/user.entity";
import { Course } from "./courses/entities/course.entity";

async function seed() {
  await AppDataSource.initialize(); // Initializes the DataSource

  const roleRepo = AppDataSource.getRepository(Role);
  const userRepo = AppDataSource.getRepository(User);
  const courseRepo = AppDataSource.getRepository(Course);

  // Seed roles
  const adminRole = roleRepo.create({ name: "admin" });
  const teacherRole = roleRepo.create({ name: "teacher" });
  const studentRole = roleRepo.create({ name: "student" });
  await roleRepo.save([adminRole, teacherRole, studentRole]);

  // Seed users
  const adminAndTeacher = userRepo.create({
    username: "adminTeacherUser",
    password: "hashed_password",
    roles: [adminRole, teacherRole], // This user is both an admin and a teacher
  });

  const studentUser = userRepo.create({
    username: "studentUser",
    password: "hashed_student_password",
    roles: [studentRole], // This user is only a student
  });

  const studentUser2 = userRepo.create({
    username: "studentUser2",
    password: "hashed_student_password",
    roles: [studentRole], // This user is only a student
  });

  const multiRoleUser = userRepo.create({
    username: "multiRoleUser",
    password: "hashed_multi_password",
    roles: [adminRole, teacherRole, studentRole], // This user has all three roles
  });

  await userRepo.save([
    adminAndTeacher,
    studentUser,
    studentUser2,
    multiRoleUser,
  ]);

  // Seed courses
  const course1 = courseRepo.create({
    title: "Introduction to Programming",
    description: "Learn the basics of programming.",
    teacher: adminAndTeacher,
  });
  const course2 = courseRepo.create({
    title: "Advanced Algorithms",
    description: "Learn about advanced algorithms.",
    teacher: adminAndTeacher,
  });
  await courseRepo.save([course1, course2]);

  // Enroll students in courses
  course1.students = [studentUser, studentUser2];
  course2.students = [studentUser];
  await courseRepo.save([course1, course2]);

  console.log("Seeding complete!");
  await AppDataSource.destroy(); // Close the connection after seeding
}

seed()
  .then(() => console.log("Seeding complete!"))
  .catch((err) => console.error("Seeding error:", err));
