import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import styles from "./HomePage.module.css";

function HomePage() {
  const { isLoggedIn, userName, role, logout } = useAuth();

  function handleLogout() {
    logout();
  }

  return (
    <div className={styles.page}>
      <nav className={styles.navbarCustom}>
        <Link to="/" className={styles.brand}>
          <img src="/images/logo.jpg" alt="Văn Cô Nhung" />
          <span className={styles.srOnly}>Văn Cô Nhung</span>
        </Link>
        <div className={styles.navLinks}>
          <a href="#grades">Khối lớp</a>
          <a href="#pricing">Học phí</a>
          <a href="#guide">Đăng ký</a>
          <a href="#contact">Liên hệ</a>
        </div>
        <div className={styles.navActions}>
          {isLoggedIn ? (
            <>
              <span className={styles.userGreeting}>Xin chào, {userName}</span>
              {role === "TEACHER" ? (
                <Link to="/admin" className={styles.btnBrand}>
                  Vào trang quản lý
                </Link>
              ) : (
                <a href="/student" className={styles.btnBrand}>
                  Vào trang học tập
                </a>
              )}
              <a
                href="/"
                onClick={handleLogout}
                className={styles.btnOutlineBrand}
              >
                Đăng xuất
              </a>
            </>
          ) : (
            <Link to="/login" className={styles.btnOutlineBrand}>
              Đăng nhập
            </Link>
          )}
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.heroTag}>
            ● Lớp học thêm Văn · Lớp 5 - Lớp 11
          </div>
          <h1>
            Học Văn <em>vui - chắc - điểm cao</em>
          </h1>
          <p>
            Lớp học thêm Văn Cô Nhung nhận học sinh từ lớp 5 đến lớp 11. Bám sát
            chương trình trên lớp, luyện viết đoạn - viết bài bài bản, giúp con
            tự tin hơn với môn Văn mỗi ngày đến lớp.
          </p>

          <div className={styles.heroCta}>
            <a
              href="#contact"
              className={`${styles.btnBrand} ${styles.btnLgBrand}`}
            >
              Đăng ký học ngay
            </a>
            <a
              href="#grades"
              className={`${styles.btnOutlineBrand} ${styles.btnLgBrand}`}
            >
              Xem các khối lớp
            </a>
          </div>
          <div className={styles.heroNote}>
            <span className={styles.check}>✓</span> Lớp học nhỏ, sĩ số giới hạn
            ·
          </div>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.heroPhotoWrap}>
            <img
              src="/images/banner.jpg"
              alt="Cô Nhung - Văn Cô Nhung"
              className={styles.heroPhoto}
            />
          </div>
        </div>
      </section>

      <section
        id="grades"
        className={`${styles.block} ${styles.gradesSection}`}
      >
        <div className={styles.sectionHeader}>
          <div className={styles.heroTag}>
            ● Các khối lớp đang nhận học sinh
          </div>
          <h2>Lộ trình phù hợp cho từng khối lớp</h2>
          <p>
            Mỗi khối lớp có giáo trình riêng, bám sát sách giáo khoa và định
            hướng thi cử của từng cấp học.
          </p>
        </div>
        <div className={styles.gradeGrid}>
          {[
            {
              badge: "5",
              title: "Lớp 5",
              desc: "Rèn nền tảng viết đoạn văn, làm quen cảm thụ văn học, chuẩn bị vào cấp 2.",
            },
            {
              badge: "6",
              title: "Lớp 6",
              desc: "Làm quen chương trình THCS, luyện kỹ năng đọc hiểu và viết bài văn hoàn chỉnh.",
            },
            {
              badge: "7",
              title: "Lớp 7",
              desc: "Củng cố kiến thức tiếng Việt, nâng cao kỹ năng nghị luận và biểu cảm.",
            },
            {
              badge: "8",
              title: "Lớp 8",
              desc: "Luyện viết văn nghị luận xã hội, nghị luận văn học theo cấu trúc chuẩn.",
            },
            {
              badge: "9",
              title: "Lớp 9",
              desc: "Ôn luyện trọng tâm thi vào lớp 10, luyện đề sát cấu trúc đề thi thực tế.",
            },
            {
              badge: "10",
              title: "Lớp 10",
              desc: "Làm quen chương trình THPT, nâng cao tư duy phân tích tác phẩm văn học.",
            },
            {
              badge: "11",
              title: "Lớp 11",
              desc: "Xây dựng nền tảng vững chắc, chuẩn bị sớm cho kỳ thi tốt nghiệp THPT.",
            },
            {
              badge: "✎",
              title: "Lớp bổ trợ riêng",
              desc: "Kèm 1-1 hoặc nhóm nhỏ theo nhu cầu, linh hoạt thời gian và tiến độ học.",
            },
          ].map((grade) => (
            <div className={styles.gradeCard} key={grade.title}>
              <div className={styles.gradeBadge}>{grade.badge}</div>
              <h3>{grade.title}</h3>
              <p>{grade.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className={styles.block}>
        <div className={styles.sectionHeader}>
          <div className={styles.heroTag}>● Học phí</div>
          <h2>Học phí rõ ràng theo từng khối lớp</h2>
        </div>
        <div className={styles.pricingGrid}>
          <div className={styles.priceCard}>
            <div className={styles.planName}>Lớp 5 - Lớp 7</div>
            <div className={styles.planPrice}>
              60.000đ <small>/buổi</small>
            </div>
            <div className={styles.planDesc}>2 buổi/tuần · 90 phút/buổi</div>
            <ul>
              <li>
                <span className={styles.check}>✓</span> Rèn nền tảng viết đoạn
                văn
              </li>
              <li>
                <span className={styles.check}>✓</span> Sĩ số tối đa 12 học sinh
              </li>
              <li>
                <span className={styles.check}>✓</span> Kiểm tra định kỳ hàng
                tháng
              </li>
            </ul>
            <a
              href="#contact"
              className={`${styles.btnOutlineBrand} ${styles.fullWidth}`}
            >
              Đăng ký lớp này
            </a>
          </div>
          <div className={`${styles.priceCard} ${styles.featured}`}>
            <div className={styles.planName}>Lớp 8 - Lớp 9</div>
            <div className={styles.planPrice}>
              60.000đ <small>/buổi</small>
            </div>
            <div className={styles.planDesc}>
              2 buổi/tuần · 90 phút/buổi · Có lớp luyện thi vào 10
            </div>
            <ul>
              <li>
                <span className={styles.check}>✓</span> Luyện nghị luận xã hội
                &amp; văn học
              </li>
              <li>
                <span className={styles.check}>✓</span> Luyện đề sát cấu trúc
                thi
              </li>
              <li>
                <span className={styles.check}>✓</span> Chấm - chữa bài chi tiết
              </li>
            </ul>
            <a
              href="#contact"
              className={`${styles.btnBrand} ${styles.fullWidth}`}
            >
              Đăng ký lớp này
            </a>
          </div>
          <div className={styles.priceCard}>
            <div className={styles.planName}>Lớp 10 - Lớp 11</div>
            <div className={styles.planPrice}>
              60.000đ <small>/buổi</small>
            </div>
            <div className={styles.planDesc}>2 buổi/tuần · 90 phút/buổi</div>
            <ul>
              <li>
                <span className={styles.check}>✓</span> Nâng cao tư duy phân
                tích
              </li>
              <li>
                <span className={styles.check}>✓</span> Xây nền cho kỳ thi TN
                THPT
              </li>
              <li>
                <span className={styles.check}>✓</span> Tài liệu &amp; đề luyện
                riêng
              </li>
            </ul>
            <a
              href="#contact"
              className={`${styles.btnOutlineBrand} ${styles.fullWidth}`}
            >
              Đăng ký lớp này
            </a>
          </div>
        </div>
      </section>

      <section id="guide" className={`${styles.block} ${styles.guideSection}`}>
        <div className={styles.sectionHeader}>
          <div className={styles.heroTag}>● Đăng ký học</div>
          <h2>Chỉ 3 bước để con bắt đầu học</h2>
        </div>
        <div className={styles.guideSteps}>
          <div className={styles.guideStep}>
            <div className={styles.stepNum}>1</div>
            <h4>Liên hệ đăng ký</h4>
            <p>Nhắn tin hoặc gọi điện cho cô Nhung để đăng ký học thử.</p>
          </div>
          <div className={styles.guideStep}>
            <div className={styles.stepNum}>2</div>
            <h4>Xếp lớp theo khối</h4>
            <p>Con được xếp vào lớp đúng khối, phù hợp trình độ hiện tại.</p>
          </div>
          <div className={styles.guideStep}>
            <div className={styles.stepNum}>3</div>
            <h4>Vào lớp chính thức</h4>
            <p>Đăng ký học phí và bắt đầu lộ trình học theo đúng khối lớp.</p>
          </div>
        </div>
      </section>

      <section id="contact" className={styles.block}>
        <div className={styles.contactBox}>
          <div>
            <h2>Đăng ký học ngay hôm nay</h2>
            <p>
              Liên hệ với cô Nhung để được tư vấn khối lớp phù hợp và xếp lịch
              học.
            </p>
          </div>
          <div className={styles.contactInfo}>
            <div>
              <div className={styles.label}>Điện thoại</div>
              <div>0933621222</div>
            </div>
            <div>
              <div className={styles.label}>Facebook</div>
              <div>https://www.facebook.com/nhung.nguyen.164000</div>
            </div>
            <div>
              <div className={styles.label}>Địa chỉ lớp học</div>
              <div>
                Số 243 - Đường An Dương Vương - Phường Hòa Bình - Phú Thọ
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.brandMini}>
          <img src="/images/logo.jpg" alt="Văn Cô Nhung" />
        </div>
        <div>© {new Date().getFullYear()} Văn Cô Nhung. Học Là Vui!</div>
      </footer>
    </div>
  );
}

export default HomePage;
