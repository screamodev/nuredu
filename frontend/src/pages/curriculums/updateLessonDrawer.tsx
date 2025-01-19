import {
    Button,
    Container,
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
import { useEffect, useState } from "react";
import { IconArrowRight, IconCheck, IconCloudUpload, IconExclamationMark, IconX } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { LanguagePicker, languagesData } from "../../components/sidebar/LanguagePicker.tsx";
import { notifications } from "@mantine/notifications";
import AdminService from "../../api/AdminService.ts";
// ---------- IMPORTANT: Use your new data shape here ----------
import * as curriculumData from "./curriculumData.json";

// This interface now matches the new field naming
interface UpdateLessonProps {
    id: string;
    language: string;
    specialityName: string;       // e.g. "Software Engineering"
    gradeNumber: number;          // e.g. 1, 2, ...
    lessonQueue: number;          // e.g. 1, 2
    lessonTitle: string;          // e.g. "Intro to Robotics"

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

interface UpdateLessonDrawerProps {
    opened: boolean;
    onClose: () => void;
    lesson: UpdateLessonProps;  // the existing data to edit
}

// The DTO we send to the server
interface UpdateLessonDto {
    id: string;
    language: string;
    specialityName: string;
    gradeNumber: number;
    lessonQueue: number;
    lessonTitle: string;

    topicTitle: string;
    topicQueue: number;
    lessonType: string;
    lessonObjectives: string;
    lessonEquipment: string;     // JSON string
    priorKnowledge: string;
    lessonStart: string;
    lessonMiddle: string;
    lessonEnd: string;
    videoLinks: string;          // JSON
    presentationLinks: string;   // JSON
    linkForDoc: string;
    additionalResources: string; // JSON
}

export default function UpdateLessonDrawer({ opened, onClose, lesson }: UpdateLessonDrawerProps) {
    const [loading, setLoading] = useState(false);

    // 1) Initialize form with the existing lesson data
    const lessonForm = useForm({
        initialValues: {
            language: languagesData.find((item) => item.value === lesson.language) || languagesData[0],
            specialityName: lesson.specialityName ?? "",
            gradeNumber: lesson.gradeNumber ?? 0,
            lessonQueue: lesson.lessonQueue ?? 0,
            lessonTitle: lesson.lessonTitle ?? "",

            topicTitle: lesson.topicTitle ?? "",
            topicQueue: lesson.topicQueue ?? 0,
            lessonType: lesson.lessonType ?? "",
            lessonObjectives: lesson.lessonObjectives ?? "",
            lessonEquipment: lesson.lessonEquipment ?? [],
            priorKnowledge: lesson.priorKnowledge ?? "",
            lessonStart: lesson.lessonStart ?? "",
            lessonMiddle: lesson.lessonMiddle ?? "",
            lessonEnd: lesson.lessonEnd ?? "",
            videoLinks: lesson.videoLinks ?? [],
            presentationLinks: lesson.presentationLinks ?? [],
            linkForDoc: lesson.linkForDoc ?? "",
            additionalResources: lesson.additionalResources ?? []
        }
    });

    // Destructure for convenience
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

    // 2) Based on the chosen language, retrieve the relevant specialities
    const allSpecialities = curriculumData.specialities[language.value] || [];

    // Once we have them, we'll find the currently selected speciality
    const foundSpeciality = allSpecialities.find((sp: any) => sp.name === specialityName);

    // Then the grades for that speciality
    const gradeOptions = foundSpeciality
        ? foundSpeciality.grades.map((g: any) => ({
            label: `Grade ${g.gradeNumber}`,
            value: g.gradeNumber
        }))
        : [];

    // Then the lessons for the chosen grade
    const foundGrade = foundSpeciality?.grades.find(
        (g: any) => g.gradeNumber === +gradeNumber
    );
    const lessonOptions = foundGrade
        ? foundGrade.lessons.map((l: any) => ({
            label: `[${l.queue}] - ${l.title}`,
            value: l.queue
        }))
        : [];

    // We also retrieve the lesson types for the chosen language
    const lessonTypes = curriculumData.lessonTypes[language.value] || [];

    // If user changes language, we might want to partially reset fields:
    const handleLanguageChange = (val: any) => {
        // let’s keep topicTitle, objectives, etc.
        // but reset the “specialityName/gradeNumber/lessonQueue/lessonTitle”
        // because they might not exist in the new language
        lessonForm.setFieldValue("language", val);
        lessonForm.setFieldValue("specialityName", "");
        lessonForm.setFieldValue("gradeNumber", 0);
        lessonForm.setFieldValue("lessonQueue", 0);
        lessonForm.setFieldValue("lessonTitle", "");
    };

    // 3) “Update” method
    const updateLesson = () => {
        // Basic checks
        if (!specialityName || !gradeNumber || !lessonQueue || !lessonTitle) {
            notifications.show({
                withCloseButton: true,
                autoClose: 2000,
                title: "Enter all required data!",
                message: "Must pick Speciality, Grade, and Lesson",
                color: "yellow",
                icon: <IconExclamationMark />,
                loading: false
            });
            return;
        }

        // Create the DTO
        const payload: UpdateLessonDto = {
            id: lesson.id,
            language: language.value,
            specialityName,
            gradeNumber: +gradeNumber,
            lessonQueue: +lessonQueue,
            lessonTitle,

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

        setLoading(true);
        AdminService.updateLesson(payload)
            .then((res) => {
                setLoading(false);
                onClose();
                // If you want to refresh the page or re-fetch data
                location.reload();
                notifications.show({
                    title: "Lesson updated!",
                    message: "",
                    color: "green",
                    icon: <IconCheck />,
                    autoClose: 2000
                });
            })
            .catch((error) => {
                setLoading(false);
                notifications.show({
                    title: "Something went wrong, try later.",
                    message: "",
                    color: "red",
                    icon: <IconX />,
                    autoClose: 2000
                });
                console.error(error);
            });
    };

    // The user might want to see “live info” about the selected grade/lesson:
    // We'll compute them or just show them in the UI.

    return (
        <Drawer
            position="right"
            size="50%"
            opened={opened}
            onClose={onClose}
            title={<b>Update lesson</b>}
        >
            <Divider />
            <Space h={30} />

            <Text fw={600} size="14px">
                Choose lesson language
            </Text>
            <LanguagePicker
                selected={language}
                setSelected={handleLanguageChange}
            />

            <Space h={30} />

            {/* Step 1: Pick Speciality */}
            <Select
                label="Choose Speciality"
                placeholder="Pick a speciality"
                data={allSpecialities.map((s: any) => ({
                    label: s.name,
                    value: s.name
                }))}
                {...lessonForm.getInputProps("specialityName")}
            />

            {/* Step 2: Pick Grade */}
            {specialityName && (
                <>
                    <Space h={20} />
                    <Select
                        label="Choose Grade"
                        placeholder="Pick a grade"
                        data={gradeOptions}
                        {...lessonForm.getInputProps("gradeNumber")}
                    />
                </>
            )}

            {/* Step 3: Pick Lesson */}
            {specialityName && gradeNumber !== 0 && (
                <>
                    <Space h={20} />
                    <Select
                        label="Choose Lesson"
                        placeholder="Pick a lesson"
                        data={lessonOptions}
                        value={lessonQueue || undefined}
                        onChange={(newValue) => {
                            lessonForm.setFieldValue("lessonQueue", +newValue);
                            // find the actual lesson in foundGrade
                            const found = foundGrade?.lessons.find(
                                (ls: any) => ls.queue === +newValue
                            );
                            if (found) {
                                lessonForm.setFieldValue("lessonTitle", found.title);
                            }
                        }}
                    />
                </>
            )}

            {/*
        Additional fields:
        topicTitle, topicQueue, lessonType, etc.
        Only display them once the lesson is chosen
      */}
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
                            placeholder="Pick a lesson type"
                            data={lessonTypes}
                            {...lessonForm.getInputProps("lessonType")}
                        />
                        <Textarea
                            label="Lesson Objectives"
                            autosize
                            {...lessonForm.getInputProps("lessonObjectives")}
                        />
                    </Flex>
                    <Space h={30} />

                    <TagsInput
                        label="Lesson Equipment"
                        placeholder="Press Enter to submit"
                        value={lessonEquipment}
                        onChange={(vals) =>
                            lessonForm.setFieldValue("lessonEquipment", vals)
                        }
                    />
                    <Space h={30} />

                    {/* Prior Knowledge */}
                    <Textarea
                        label="Prior Knowledge"
                        autosize
                        {...lessonForm.getInputProps("priorKnowledge")}
                    />

                    <Space h={30} />
                    <Table striped highlightOnHover withTableBorder withColumnBorders>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Lesson Step</Table.Th>
                                <Table.Th>Planned Activity</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            <Table.Tr>
                                <Table.Td>Lesson Start (0-10 minutes)</Table.Td>
                                <Table.Td>
                                    <Textarea
                                        autosize
                                        {...lessonForm.getInputProps("lessonStart")}
                                    />
                                </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td>Middle of Lesson (10-30 minutes)</Table.Td>
                                <Table.Td>
                                    <Textarea
                                        autosize
                                        {...lessonForm.getInputProps("lessonMiddle")}
                                    />
                                </Table.Td>
                            </Table.Tr>
                            <Table.Tr>
                                <Table.Td>End of Lesson (30-40 minutes)</Table.Td>
                                <Table.Td>
                                    <Textarea
                                        autosize
                                        {...lessonForm.getInputProps("lessonEnd")}
                                    />
                                </Table.Td>
                            </Table.Tr>
                        </Table.Tbody>
                    </Table>

                    <Space h={30} />
                    <TagsInput
                        label="Video Links"
                        placeholder="Press Enter to add link"
                        value={videoLinks}
                        onChange={(vals) => lessonForm.setFieldValue("videoLinks", vals)}
                    />
                    <TagsInput
                        label="Presentation Links"
                        placeholder="Press Enter to add link"
                        value={presentationLinks}
                        onChange={(vals) =>
                            lessonForm.setFieldValue("presentationLinks", vals)
                        }
                    />
                    <TextInput
                        label="Document Link"
                        type="url"
                        placeholder="https://example.com"
                        {...lessonForm.getInputProps("linkForDoc")}
                    />
                    <TagsInput
                        label="Additional Resources"
                        placeholder="Press Enter to add resource"
                        value={additionalResources}
                        onChange={(vals) =>
                            lessonForm.setFieldValue("additionalResources", vals)
                        }
                    />

                    <Space h={30} />
                    <Button
                        leftSection={<IconCloudUpload />}
                        color="blue"
                        onClick={updateLesson}
                        loading={loading}
                        disabled={loading}
                    >
                        Complete and update lesson
                    </Button>
                </>
            )}
        </Drawer>
    );
}
