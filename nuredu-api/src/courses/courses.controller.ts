import { Controller, Get, Post, Patch, Param, Delete } from "@nestjs/common";
import { CoursesService } from "./courses.service";

@Controller("courses")
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  create() {
    return this.coursesService.create();
  }

  @Get()
  findAll() {
    return this.coursesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.coursesService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string) {
    return this.coursesService.update(+id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.coursesService.remove(+id);
  }
}
