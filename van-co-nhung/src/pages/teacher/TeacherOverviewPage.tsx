import { useAuth } from "../../hooks/useAuth";

const stats = [
  { label: "Lớp đang dạy", value: 0 },
  { label: "Học sinh", value: 0 },
  { label: "Buổi học tuần này", value: 0 },
];

function TeacherOverviewPage() {
  const { userName } = useAuth();

  return (
    <>
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Tổng quan</h1>
        <p className="text-muted-foreground">Xin chào, {userName}</p>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-background p-5">
            <div className="mb-2 text-sm text-muted-foreground">{stat.label}</div>
            <div className="text-3xl font-bold text-foreground">{stat.value}</div>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-dashed border-border bg-background p-10 text-center text-muted-foreground">
        <p>Các chức năng quản lý lớp học, điểm danh và học phí sẽ hiển thị tại đây.</p>
      </section>
    </>
  );
}

export default TeacherOverviewPage;
