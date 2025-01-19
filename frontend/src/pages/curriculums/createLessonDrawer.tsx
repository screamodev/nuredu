import {
    Button,
    Divider,
    Drawer,
    Flex,
    Input,
    NumberInput,
    Select,
    Space,
    Table,
    TagsInput,
    Text,
    Textarea,
    TextInput
} from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { LanguagePicker, languagesData } from "../../components/sidebar/LanguagePicker.tsx";
import LessonPage from "../../components/curriculums/LessonPage.tsx";
import { notifications } from "@mantine/notifications";
import AdminService from "../../api/AdminService.ts";
// IMPORTANT: This file should have “specialities” in it:
import * as curriculumData from "./curriculumData.json";

interface CreateLessonDrawerProps {
    opened: boolean;
    onClose: () => void;
    fetchLessons: () => void; // callback to re-fetch lesson list after creation
}

/**
 * This is how the user sees it in the UI:
 *   language, specialityName, gradeNumber, lessonQueue, lessonTitle, ...
 */
interface CreateLessonFormValues {
    language: any; // e.g. { label: 'English', value: 'us' }
    specialityName: string;
    gradeNumber: number;
    lessonQueue: number;
    lessonTitle: string;

    topicTitle: string;
    topicQueue: number;
    lessonType: string;
    lessonObjectives: string;
    lessonEquipment: string[];
    priorKnowledge: string;
    lessonStart: string;
    lessonMiddle: string;
    lessonEnd: string;
    videoLinks: string[];
    presentationLinks: string[];
    linkForDoc: string;
    additionalResources: string[];
}

/**
 * This is the final shape your **server** expects,
 * matching the DB columns:
 * {
 *   language: string,
 *   grade: number,
 *   chapterQueue: number,
 *   chapter: string,
 *   topicTitle: string,
 *   topicQueue: number,
 *   lessonType: string,
 *   lessonObjectives: string,
 *   lessonEquipment: string,
 *   priorKnowledge: string,
 *   lessonStart: string,
 *   lessonMiddle: string,
 *   lessonEnd: string,
 *   videoLinks: string,
 *   presentationLinks: string,
 *   linkForDoc: string,
 *   additionalResources: string
 * }
 */
interface CreateLessonDto {
    language: string;
    grade: number;              // was gradeNumber in UI
    chapterQueue: number;       // was lessonQueue in UI
    chapter: string;            // was lessonTitle in UI

    topicTitle: string;
    topicQueue: number;
    lessonType: string;
    lessonObjectives: string;
    lessonEquipment: string;
    priorKnowledge: string;
    lessonStart: string;
    lessonMiddle: string;
    lessonEnd: string;
    videoLinks: string;
    presentationLinks: string;
    linkForDoc: string;
    additionalResources: string;
}

export default function CreateLessonDrawer({
                                               opened,
                                               onClose,
                                               fetchLessons
                                           }: CreateLessonDrawerProps) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [lessonPreview, setLessonPreview] = useState(false);
    const [loading, setLoading] = useState(false);

    // 1) Our form uses the “UI” shape:
    const lessonForm = useForm<CreateLessonFormValues>({
        initialValues: {
            language: languagesData[0],
            specialityName: "",
            gradeNumber: 0,
            lessonQueue: 0,
            lessonTitle: "",

            topicTitle: "",
            topicQueue: 0,
            lessonType: "",
            lessonObjectives: "",
            lessonEquipment: [],
            priorKnowledge: "",
            lessonStart: "",
            lessonMiddle: "",
            lessonEnd: "",
            videoLinks: [],
            presentationLinks: [],
            linkForDoc: "",
            additionalResources: []
        }
    });

    const {
        language,
        specialityName,
        gradeNumber,
        lessonQueue,
        lessonTitle,
        topicTitle,
        topicQueue,
        lessonType,
        lessonObjectives,
        lessonEquipment,
        priorKnowledge,
        lessonStart,
        lessonMiddle,
        lessonEnd,
        videoLinks,
        presentationLinks,
        linkForDoc,
        additionalResources
    } = lessonForm.values;

    // 2) Retrieve "specialities" from JSON based on language
    const allSpecialities = curriculumData.specialities?.[language.value] || [];

    // Then find the selected speciality object
    const foundSpeciality = allSpecialities.find((s: any) => s.name === specialityName);

    // If found, get that speciality’s grade options
    const gradeOptions = foundSpeciality
        ? foundSpeciality.grades.map((g: any) => ({
            value: g.gradeNumber,
            label: `Grade ${g.gradeNumber}`
        }))
        : [];

    // Once a grade is picked, we can find that “grade” object:
    const foundGrade = foundSpeciality?.grades.find(
        (g: any) => g.gradeNumber === +gradeNumber
    );

    // Then get lesson options from that grade
    const lessonOptions = foundGrade
        ? foundGrade.lessons.map((l: any) => ({
            value: l.queue,
            label: `[${l.queue}] - ${l.title}`
        }))
        : [];

    // Also retrieve "lessonTypes" from JSON for the chosen language
    const lessonTypes = curriculumData.lessonTypes?.[language.value] || [];

    // If user changes language, reset the speciality/grade/lesson
    const handleLanguageChange = (val: any) => {
        lessonForm.setFieldValue("language", val);
        lessonForm.setFieldValue("specialityName", "");
        lessonForm.setFieldValue("gradeNumber", 0);
        lessonForm.setFieldValue("lessonQueue", 0);
        lessonForm.setFieldValue("lessonTitle", "");
    };

    // 3) On "Preview" we show a “LessonPage”
    const previewLesson = () => {
        setLessonPreview(true);
    };

    // 4) On "Submit," we create the final payload with DB columns
    const completeLesson = async () => {
        // Basic checks
        if (!specialityName || !gradeNumber || !lessonQueue || !lessonTitle) {
            notifications.show({
                title: "Enter all required data!",
                message: "Must pick Speciality, Grade, and Lesson",
                color: "yellow",
                icon: <IconX />,
                autoClose: 2000
            });
            return;
        }

        // Construct the DB-compatible DTO:
        const payload: CreateLessonDto = {
            language: language.value,
            grade: +gradeNumber,            // DB column "grade"
            chapterQueue: +lessonQueue,     // DB column "chapterQueue"
            chapter: lessonTitle,           // DB column "chapter"

            topicTitle,
            topicQueue: +topicQueue,
            lessonType,
            lessonObjectives,
            lessonEquipment: JSON.stringify(lessonEquipment),
            priorKnowledge,
            lessonStart,
            lessonMiddle,
            lessonEnd,
            videoLinks: JSON.stringify(videoLinks),
            presentationLinks: JSON.stringify(presentationLinks),
            linkForDoc,
            additionalResources: JSON.stringify(additionalResources)
        };

        try {
            setLoading(true);
            await AdminService.createLesson(payload);
            setLoading(false);
            fetchLessons();
            onClose();
            notifications.show({
                title: "Lesson created!",
                color: "green",
                icon: <IconCheck />,
                autoClose: 2000
            });
        } catch (error) {
            setLoading(false);
            notifications.show({
                title: "Something went wrong, try later.",
                color: "red",
                icon: <IconX />,
                autoClose: 2000
            });
            console.error(error);
        }
    };

    // 5) Return the Drawer UI
    return (
        <Drawer
            position="right"
            size={lessonPreview ? "100%" : "50%"}
            opened={opened}
            onClose={onClose}
            title={lessonPreview ? "" : <b>Add new lesson</b>}
        >
            <div ref={ref}>
                {lessonPreview ? (
                    // Show the "preview" page
                    <LessonPage
                        // We'll pass the "UI" fields to your lesson page, or rename them there
                        language={language.value}
                        // Because DB calls it "grade," but we call it "gradeNumber"
                        grade={gradeNumber}
                        chapterQueue={lessonQueue}
                        chapter={lessonTitle}
                        topicTitle={topicTitle}
                        topicQueue={topicQueue}
                        lessonType={lessonType}
                        lessonObjectives={lessonObjectives}
                        lessonEquipment={lessonEquipment}
                        priorKnowledge={priorKnowledge}
                        lessonStart={lessonStart}
                        lessonMiddle={lessonMiddle}
                        lessonEnd={lessonEnd}
                        videoLinks={videoLinks}
                        presentationLinks={presentationLinks}
                        linkForDoc={linkForDoc}
                        additionalResources={additionalResources}
                    />
                ) : (
                    <>
                        <Divider />
                        <Space h={30} />

                        <Text fw={600} pb={10} size="14px">
                            Choose lesson language
                        </Text>
                        <LanguagePicker selected={language} setSelected={handleLanguageChange} />

                        <Space h={30} />
                        {/* Speciality select */}
                        <Select
                            label="Choose Speciality"
                            placeholder="Pick a speciality"
                            data={allSpecialities.map((s: any) => ({
                                label: s.name,
                                value: s.name
                            }))}
                            {...lessonForm.getInputProps("specialityName")}
                        />

                        {specialityName && (
                            <>
                                <Space h={20} />
                                {/* Grade select */}
                                <Select
                                    label="Choose Grade"
                                    placeholder="Pick a grade"
                                    data={
                                        foundSpeciality
                                            ? foundSpeciality.grades.map((g: any) => ({
                                                value: g.gradeNumber.toString(), // must be string
                                                label: `Grade ${g.gradeNumber}`,
                                            }))
                                            : []
                                    }
                                    // Convert numeric gradeNumber -> string
                                    value={
                                        lessonForm.values.gradeNumber
                                            ? lessonForm.values.gradeNumber.toString()
                                            : ""
                                    }
                                    // parse string -> number for the form
                                    onChange={(val: any) => lessonForm.setFieldValue("gradeNumber", parseInt(val, 10))}
                                />
                            </>
                        )}

                        {specialityName && gradeNumber !== 0 && (
                            <>
                                <Space h={20} />
                                {/* Lesson select */}
                                <Select
                                    label="Choose Lesson"
                                    placeholder="Pick a lesson"
                                    data={
                                        foundGrade
                                            ? foundGrade.lessons.map((l: any) => ({
                                                value: l.queue.toString(),
                                                label: `[${l.queue}] - ${l.title}`,
                                            }))
                                            : []
                                    }
                                    // convert number -> string
                                    value={
                                        lessonForm.values.lessonQueue
                                            ? lessonForm.values.lessonQueue.toString()
                                            : ""
                                    }
                                    onChange={(val) => {
                                        const numericQueue = parseInt(val, 10);
                                        lessonForm.setFieldValue("lessonQueue", numericQueue);
                                        // find the actual lesson
                                        const foundLesson = foundGrade?.lessons.find(
                                            (ls: any) => ls.queue === numericQueue
                                        );
                                        if (foundLesson) {
                                            lessonForm.setFieldValue("lessonTitle", foundLesson.title);
                                        }
                                    }}
                                />
                            </>
                        )}

                        {/* Show the rest once the user picks a lesson */}
                        {specialityName && gradeNumber !== 0 && lessonQueue !== 0 && (
                            <>
                                <Space h={30} />
                                <Flex gap={30}>
                                    <NumberInput
                                        label="Topic Queue"
                                        min={1}
                                        {...lessonForm.getInputProps("topicQueue")}
                                    />
                                    <Input.Wrapper label="Topic Title">
                                        <Input
                                            placeholder="Enter lesson topic title"
                                            {...lessonForm.getInputProps("topicTitle")}
                                        />
                                    </Input.Wrapper>
                                </Flex>

                                <Space h={30} />
                                <Flex gap={30}>
                                    <Select
                                        label="Lesson Type"
                                        data={lessonTypes}
                                        {...lessonForm.getInputProps("lessonType")}
                                    />
                                    <Textarea
                                        label="Lesson objectives"
                                        autosize
                                        {...lessonForm.getInputProps("lessonObjectives")}
                                    />
                                </Flex>
                                <Space h={20} />
                                <TagsInput
                                    label="Lesson equipment"
                                    placeholder="Press Enter to add equipment"
                                    value={lessonEquipment}
                                    onChange={(value) => lessonForm.setFieldValue("lessonEquipment", value)}
                                />
                                <Space h={20} />
                                <Textarea
                                    label="Prior Knowledge"
                                    autosize
                                    {...lessonForm.getInputProps("priorKnowledge")}
                                />

                                <Space h={20} />
                                <Table striped highlightOnHover withTableBorder withColumnBorders>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Lesson Step</Table.Th>
                                            <Table.Th>Activity</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        <Table.Tr>
                                            <Table.Td>Lesson Start</Table.Td>
                                            <Table.Td>
                                                <Textarea
                                                    autosize
                                                    placeholder="Plan for lesson start"
                                                    {...lessonForm.getInputProps("lessonStart")}
                                                />
                                            </Table.Td>
                                        </Table.Tr>
                                        <Table.Tr>
                                            <Table.Td>Middle of Lesson</Table.Td>
                                            <Table.Td>
                                                <Textarea
                                                    autosize
                                                    placeholder="Plan for lesson middle"
                                                    {...lessonForm.getInputProps("lessonMiddle")}
                                                />
                                            </Table.Td>
                                        </Table.Tr>
                                        <Table.Tr>
                                            <Table.Td>Lesson End</Table.Td>
                                            <Table.Td>
                                                <Textarea
                                                    autosize
                                                    placeholder="Plan for lesson end"
                                                    {...lessonForm.getInputProps("lessonEnd")}
                                                />
                                            </Table.Td>
                                        </Table.Tr>
                                    </Table.Tbody>
                                </Table>

                                <Space h={20} />
                                <TagsInput
                                    label="Video Links"
                                    placeholder="Add video links"
                                    value={videoLinks}
                                    onChange={(value) => lessonForm.setFieldValue("videoLinks", value)}
                                />
                                <TagsInput
                                    label="Presentation Links"
                                    placeholder="Add presentation links"
                                    value={presentationLinks}
                                    onChange={(value) => lessonForm.setFieldValue("presentationLinks", value)}
                                />
                                <TextInput
                                    label="Document Link"
                                    placeholder="https://example.com"
                                    {...lessonForm.getInputProps("linkForDoc")}
                                />
                                <TagsInput
                                    label="Additional Resources"
                                    placeholder="Add resources"
                                    value={additionalResources}
                                    onChange={(value) =>
                                        lessonForm.setFieldValue("additionalResources", value)
                                    }
                                />
                                <Space h={20} />

                                <Button onClick={previewLesson}>Preview Lesson</Button>
                                <Button onClick={completeLesson} color="green" loading={loading}>
                                    Submit Lesson
                                </Button>
                            </>
                        )}
                    </>
                )}
            </div>
        </Drawer>
    );
}
