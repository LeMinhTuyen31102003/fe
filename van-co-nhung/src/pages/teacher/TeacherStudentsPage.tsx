import StudentsSection from "./StudentsSection";

function TeacherStudentsPage() {
  return (
    <>
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Quản lý học sinh</h1>
        <p className="text-muted-foreground">Tạo và quản lý tài khoản học sinh</p>
      </header>

      <StudentsSection />
    </>
  );
}

export default TeacherStudentsPage;
