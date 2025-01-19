import {
    Box,
    Button,
    Checkbox,
    Container,
    Divider,
    Drawer,
    Flex,
    Grid,
    Group,
    Loader,
    LoadingOverlay,
    SimpleGrid,
    Space,
    Switch,
    Text,
    Title
} from "@mantine/core";
import { useEffect, useState } from "react";
import { CurriculumButton } from "../../components/buttons/CurriculumButton.tsx";
import {
    IconArrowLeft,
    IconArrowRight,
    IconCheck,
    IconExclamationMark,
    IconHandFinger,
    IconPlus,
    IconSearch,
    IconTrash
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import CreateLessonDrawer from "./createLessonDrawer.tsx"; // new create drawer
import { useUserStore } from "../../store/user";
import AdminService from "../../api/AdminService.ts";
import BasicCardButton from "../../components/curriculums/BasicCardButton.tsx";
import LessonPage from "../../components/curriculums/LessonPage.tsx";
import LessonButton from "../../components/curriculums/LessonButton.tsx";
import { notifications } from "@mantine/notifications";
import ChangeCurriculumLanguageModal from "../../components/modals/ChangeCurriculumLanguageModal.tsx";
import { useTranslation } from "react-i18next";
import LockedCardButton from "../../components/curriculums/LockedCardButton.tsx";
// -------- IMPORTANT: use your updated data that has “specialities”:
import * as curriculumData from "./curriculumData.json";

export interface LessonResponse {
    id: string;
    language: string;
    // DB columns, but we interpret them differently on the front end
    grade: number;
    chapterQueue: number;
    chapter: string;
    topicTitle: string;
    topicQueue: number;
    lessonType: string;
    lessonObjectives: string;
    lessonEquipment: string; // stored in DB as string
    priorKnowledge: string;
    lessonStart: string;
    lessonMiddle: string;
    lessonEnd: string;
    videoLinks: string;       // stored as string in DB
    presentationLinks: string;// stored as string in DB
    linkForDoc: string;
    additionalResources: string;
}

// A minimal type for a "speciality" in your JSON:
interface SpecialityJson {
    name: string;
    grades: {
        gradeNumber: number;
        lessons: {
            queue: number;
            title: string;
        }[];
    }[];
}

export default function CurriculumsPage() {
    const { t, i18n } = useTranslation();
    const { user, curriculum_language } = useUserStore();

    const [showLessonDrawer, { open, close }] = useDisclosure(false);
    const [lessons, setLessons] = useState<LessonResponse[] | null>(null);

    // UI states for selected items
    const [selectedSpeciality, setSelectedSpeciality] = useState<SpecialityJson | null>(null);
    const [selectedGradeNumber, setSelectedGradeNumber] = useState<number | null>(null);
    const [selectedLesson, setSelectedLesson] = useState<LessonResponse | null>(null);

    const [deleteMode, setDeleteMode] = useState(false);
    const [deleteList, setDeleteList] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [curriculumLanguageModalShow, setCurriculumLanguageModalShow] = useState(curriculum_language === "");

    // 1) Fetch from the server
    const fetchLessons = async () => {
        try {
            const res = await AdminService.getLessons(); // returns array of DB rows
            // Each row has { grade, chapterQueue, chapter, topicTitle, ... } as strings
            const data = res.data as LessonResponse[];

            // Convert any JSON-strings into arrays:
            data.forEach((item) => {
                item.lessonEquipment = JSON.parse(item.lessonEquipment || "[]");
                item.videoLinks = JSON.parse(item.videoLinks || "[]");
                item.presentationLinks = JSON.parse(item.presentationLinks || "[]");
                item.additionalResources = JSON.parse(item.additionalResources || "[]");
            });

            setLessons(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchLessons();
    }, [t, i18n.language]);

    // 2) Left sidebar: list of specialities from your JSON
    // E.g. newCurriculumData.specialities.us or .ua
    const allSpecialities: SpecialityJson[] = curriculumData.specialities?.[i18n.language] || [];

    // We'll map them in the sidebar
    const renderedSpecialities = allSpecialities.map((spec, index) => {
        return (
            <div key={spec.name + index}>
                <CurriculumButton
                    onClick={() => {
                        setSelectedLesson(null);
                        setSelectedGradeNumber(null);
                        setSelectedSpeciality(spec);
                    }}
                    chapters={spec.grades.length} // you can rename the prop from "chapters" to something else
                    name={spec.name} // or `name={`${spec.name}`} etc.
                />
            </div>
        );
    });

    // 3) If user picks a speciality, we list its "grades"
    let renderedGradesForSpeciality: JSX.Element[] = [];
    if (selectedSpeciality) {
        renderedGradesForSpeciality = selectedSpeciality.grades.map((gr) => {
            return (
                <BasicCardButton
                    key={`grade-${gr.gradeNumber}`}
                    onClick={() => {
                        setSelectedLesson(null);
                        setSelectedGradeNumber(gr.gradeNumber);
                    }}
                    primaryText={`Grade ${gr.gradeNumber}`}
                    secondaryText={`${gr.lessons.length} lessons`}
                    categoryText="Grades"
                />
            );
        });
    }

    // 4) If user picks a grade, we show the lessons that the teacher actually has in DB
    //    We match the DB rows (in state: lessons) that correspond to this "speciality -> gradeNumber."
    //    You might also need to check "chapterQueue" or "chapter" if you want more nested logic.
    //    Or if your JSON has the lesson queue/title, we can map them directly.
    let displayedLessons: LessonResponse[] = [];
    if (lessons && selectedSpeciality && selectedGradeNumber !== null) {
        // Filter the DB rows so that
        //   row.language == i18n.language
        //   row.grade == selectedGradeNumber
        //   row belongs to the selectedSpeciality (somehow). E.g. if "chapter" or "topicTitle" matches the speciality name?
        //   or if you have a real "specialityName" column in DB, filter by that.
        displayedLessons = lessons.filter((item) => {
            return (
                item.language === i18n.language &&
                item.grade === selectedGradeNumber
                // plus any logic to confirm it belongs to selectedSpeciality
            );
        });
    }

    // We'll convert them to "LessonButton" or "LockedCardButton"
    let renderedLessons: JSX.Element[] = [];
    if (displayedLessons.length > 0) {
        renderedLessons = displayedLessons.map((lesson) => {
            if (!user || user.role !== "ADMIN") {
                // For a teacher or user with limited access, maybe lock if certain conditions
                return (
                    <LockedCardButton
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson)}
                        primaryText={lesson.chapter} // or `lesson.topicTitle`?
                        secondaryText="Locked or limited..."
                        categoryText={`Queue ${lesson.chapterQueue}`}
                    />
                );
            } else {
                // Admin sees everything
                return (
                    <LessonButton
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson)}
                        primaryText={lesson.chapter}         // or `lesson.lessonTitle` if your code sets it
                        secondaryText={`Topic: ${lesson.topicTitle}`}
                        categoryText={`Queue ${lesson.chapterQueue}`}
                    />
                );
            }
        });
    }

    // 5) Deletion logic
    const addInDeleteList = (id: string) => {
        let newList = [...deleteList];
        const index = newList.indexOf(id);
        if (index === -1) newList.push(id);
        else newList.splice(index, 1);
        setDeleteList(newList);
    };

    const deleteTopics = async () => {
        try {
            setLoading(true);
            await AdminService.deleteLessons(deleteList);
            setDeleteList([]);
            await fetchLessons();
            setLoading(false);
            notifications.show({
                title: "Successfully deleted lessons!",
                color: "green",
                icon: <IconCheck />,
                autoClose: 2000
            });
        } catch (error) {
            setLoading(false);
            notifications.show({
                title: "Something went wrong, try later!",
                color: "red",
                icon: <IconExclamationMark />,
                autoClose: 2000
            });
            console.error(error);
        }
    };

    // 6) Render
    if (!lessons) {
        return (
            <Box style={{ display: "flex", justifyContent: "center", padding: "30% 0", backgroundColor: "white" }}>
                <Loader size={40} />
            </Box>
        );
    }

    return (
        <>
            {/* Possibly your language modal */}
            <ChangeCurriculumLanguageModal opened={curriculumLanguageModalShow} setOpened={setCurriculumLanguageModalShow} />

            {/* If a lesson is selected, show it in a Drawer */}
            <Drawer size="100%" opened={!!selectedLesson} onClose={() => setSelectedLesson(null)}>
                {selectedLesson && (
                    <LessonPage
                        id={selectedLesson.id}
                        language={selectedLesson.language}
                        priorKnowledge={selectedLesson.priorKnowledge}
                        grade={selectedLesson.grade}
                        chapterQueue={selectedLesson.chapterQueue}
                        chapter={selectedLesson.chapter}
                        topicTitle={selectedLesson.topicTitle}
                        topicQueue={selectedLesson.topicQueue}
                        lessonType={selectedLesson.lessonType}
                        // parse JSON strings => arrays
                        // @ts-ignore
                        lessonObjectives={selectedLesson.lessonObjectives}
                        lessonEquipment={selectedLesson.lessonEquipment}
                        lessonStart={selectedLesson.lessonStart}
                        lessonMiddle={selectedLesson.lessonMiddle}
                        lessonEnd={selectedLesson.lessonEnd}
                        // @ts-ignore
                        linkForDoc={selectedLesson.linkForDoc}
                        additionalResources={selectedLesson.additionalResources}
                        presentationLinks={selectedLesson.presentationLinks}
                        videoLinks={selectedLesson.videoLinks}
                    />
                )}
            </Drawer>

            {/* The "Create lesson" drawer */}
            <CreateLessonDrawer fetchLessons={fetchLessons} opened={showLessonDrawer} onClose={close} />

            <Grid gutter={30}>
                <Grid.Col span={3}>
                    <Title order={3}>Curriculums list</Title>
                    <Button
                        onClick={() => setCurriculumLanguageModalShow(true)}
                        variant="outline"
                        color="gray"
                        mt={20}
                        w="100%"
                    >
                        {t("curriculumsPage.changeLanguageButton")}
                    </Button>

                    {user?.role === "ADMIN" && (
                        <>
                            <Space h="lg" />
                            <Button
                                onClick={open}
                                variant="outline"
                                style={{ width: "100%" }}
                                leftSection={<IconPlus />}
                                color="green"
                            >
                                {t("curriculumsPage.addNewLessonButton")}
                            </Button>
                        </>
                    )}
                    <Space h="lg" />

                    {/* Render the specialities in the sidebar */}
                    {renderedSpecialities}

                    <Space h="md" />
                </Grid.Col>

                {/* Middle or Right area: show either a list of "grades" or a list of "lessons" */}
                {selectedSpeciality && !selectedGradeNumber && (
                    <Grid.Col span={9}>
                        <Title order={1} c="blue">
                            {selectedSpeciality.name}
                        </Title>
                        <Space h={30} />
                        <SimpleGrid cols={2}>{renderedGradesForSpeciality}</SimpleGrid>
                    </Grid.Col>
                )}

                {selectedSpeciality && selectedGradeNumber && !selectedLesson && (
                    <Grid.Col span={9}>
                        <LoadingOverlay visible={loading} />
                        <Flex align="center" gap={30}>
                            <Title style={{ cursor: "pointer" }} order={2} c="blue">
                                {selectedSpeciality.name}
                            </Title>
                            <IconArrowRight />
                            <Title style={{ cursor: "pointer" }} order={2} c="blue">
                                Grade {selectedGradeNumber}
                            </Title>
                        </Flex>
                        <Space h={20} />
                        <Button
                            onClick={() => setSelectedGradeNumber(null)}
                            leftSection={<IconArrowLeft />}
                            variant="outline"
                        >
                            {t("curriculumsPage.goBackButton")}
                        </Button>

                        {user?.role === "ADMIN" && (
                            <Flex gap={30} align="center" mt={20}>
                                <Box
                                    style={{
                                        margin: "20px 0",
                                        border: "#dcdcdc 1px solid",
                                        width: "300px",
                                        padding: "10px",
                                        borderRadius: "100px"
                                    }}
                                >
                                    <Switch
                                        checked={deleteMode}
                                        onChange={() => setDeleteMode(!deleteMode)}
                                        size="xl"
                                        color="red"
                                        onLabel="ON"
                                        offLabel="OFF"
                                        label={t("curriculumsPage.deleteMode")}
                                    />
                                </Box>
                                {deleteList.length > 0 && (
                                    <Button
                                        loading={loading}
                                        disabled={loading}
                                        radius="100"
                                        onClick={() => deleteTopics()}
                                        leftSection={<IconTrash />}
                                        color="red"
                                    >
                                        {t("curriculumsPage.deleteSelected", { count: deleteList.length })}
                                    </Button>
                                )}
                            </Flex>
                        )}

                        {displayedLessons.length > 0 ? (
                            <Group gap={30} mt={20}>
                                {deleteMode
                                    ? displayedLessons.map((lesson) => (
                                        <Container
                                            key={lesson.id}
                                            style={{ border: "#e8e8e8 1px solid", borderRadius: "10px" }}
                                            px={20}
                                            py={15}
                                            w="100%"
                                        >
                                            <Flex gap={30} align="center">
                                                <Checkbox
                                                    checked={deleteList.includes(lesson.id)}
                                                    size="xl"
                                                    onChange={() => addInDeleteList(lesson.id)}
                                                />
                                                <div>
                                                    <Text fw={600} size="lg">
                                                        {lesson.chapter} (queue {lesson.chapterQueue})
                                                    </Text>
                                                    <Text size="sm" c="blue">
                                                        {lesson.topicTitle}
                                                    </Text>
                                                </div>
                                            </Flex>
                                        </Container>
                                    ))
                                    : renderedLessons}
                            </Group>
                        ) : (
                            <Flex
                                style={{ border: "1px solid #858585", borderRadius: "10px" }}
                                align="center"
                                direction="column"
                                justify="center"
                                h="50vh"
                                gap={30}
                                mt={20}
                            >
                                <IconSearch size={50} />
                                <Text fw={700}>{t("curriculumsPage.noTopics")}</Text>
                            </Flex>
                        )}
                    </Grid.Col>
                )}

                {/* If nothing is selected yet */}
                {!selectedSpeciality && (
                    <Grid.Col span={9}>
                        <Flex align="center" direction="column" gap={30} justify="center" h="100vh">
                            <IconHandFinger size={50} />
                            <Title order={3} fw={500}>
                                {t("curriculumsPage.selectToView")}
                            </Title>
                        </Flex>
                    </Grid.Col>
                )}
            </Grid>
        </>
    );
}
