import ClassesSection from "./ClassesSection";

function TeacherClassesPage() {
  return (
    <>
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Quản lý lớp học</h1>
        <p className="text-muted-foreground">Tạo lớp học và xếp học sinh vào lớp</p>
      </header>

      <ClassesSection />
    </>
  );
}

export default TeacherClassesPage;
