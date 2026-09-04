import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import styles from "./HomePage.module.css";

interface GradeItem {
  badge: string;
  title: string;
  desc: string;
}

interface PricingPlan {
  name: string;
  price: string;
  desc: string;
  features: string[];
}

interface GuideStep {
  title: string;
  desc: string;
}

function HomePage() {
  const { isLoggedIn, role } = useAuth();
  const { t } = useTranslation("home");

  if (isLoggedIn && role === "TEACHER") {
    return <Navigate to="/admin" replace />;
  }
  if (isLoggedIn && role === "STUDENT") {
    return <Navigate to="/" replace />;
  }

  const grades = t("grades.items", { returnObjects: true }) as GradeItem[];
  const plans = t("pricing.plans", { returnObjects: true }) as PricingPlan[];
  const steps = t("guide.steps", { returnObjects: true }) as GuideStep[];

  return (
    <div className={styles.page}>
      <nav className={styles.navbarCustom}>
        <Link to="/" className={styles.brand}>
          <img src="/images/logo.jpg" alt="Văn Cô Nhung" />
          <span className={styles.srOnly}>Văn Cô Nhung</span>
        </Link>
        <div className={styles.navLinks}>
          <a href="#grades">{t("nav.grades")}</a>
          <a href="#pricing">{t("nav.pricing")}</a>
          <a href="#guide">{t("nav.guide")}</a>
          <a href="#contact">{t("nav.contact")}</a>
        </div>
        <div className={styles.navActions}>
          <Link to="/login" className={styles.btnOutlineBrand}>
            {t("nav.login")}
          </Link>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.heroTag}>{t("hero.tag")}</div>
          <h1>
            {t("hero.titlePrefix")} <em>{t("hero.titleEmphasis")}</em>
          </h1>
          <p>{t("hero.description")}</p>

          <div className={styles.heroCta}>
            <a href="#contact" className={`${styles.btnBrand} ${styles.btnLgBrand}`}>
              {t("hero.ctaPrimary")}
            </a>
            <a href="#grades" className={`${styles.btnOutlineBrand} ${styles.btnLgBrand}`}>
              {t("hero.ctaSecondary")}
            </a>
          </div>
          <div className={styles.heroNote}>
            <span className={styles.check}>✓</span> {t("hero.note")}
          </div>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.heroPhotoWrap}>
            <img src="/images/banner.jpg" alt={t("hero.imageAlt")} className={styles.heroPhoto} />
          </div>
        </div>
      </section>

      <section id="grades" className={`${styles.block} ${styles.gradesSection}`}>
        <div className={styles.sectionHeader}>
          <div className={styles.heroTag}>{t("grades.tag")}</div>
          <h2>{t("grades.title")}</h2>
          <p>{t("grades.description")}</p>
        </div>
        <div className={styles.gradeGrid}>
          {grades.map((grade) => (
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
          <div className={styles.heroTag}>{t("pricing.tag")}</div>
          <h2>{t("pricing.title")}</h2>
        </div>
        <div className={styles.pricingGrid}>
          {plans.map((plan, index) => (
            <div
              className={index === 1 ? `${styles.priceCard} ${styles.featured}` : styles.priceCard}
              key={plan.name}
            >
              {index === 1 && <span className={styles.featuredBadge}>{t("pricing.mostPopular")}</span>}
              <div className={styles.planName}>{plan.name}</div>
              <div className={styles.planPrice}>
                {plan.price} <small>{t("pricing.perSession")}</small>
              </div>
              <div className={styles.planDesc}>{plan.desc}</div>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <span className={styles.check}>✓</span> {feature}
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className={
                  index === 1
                    ? `${styles.btnBrand} ${styles.fullWidth}`
                    : `${styles.btnOutlineBrand} ${styles.fullWidth}`
                }
              >
                {t("pricing.cta")}
              </a>
            </div>
          ))}
        </div>
      </section>

      <section id="guide" className={`${styles.block} ${styles.guideSection}`}>
        <div className={styles.sectionHeader}>
          <div className={styles.heroTag}>{t("guide.tag")}</div>
          <h2>{t("guide.title")}</h2>
        </div>
        <div className={styles.guideSteps}>
          {steps.map((step, index) => (
            <div className={styles.guideStep} key={step.title}>
              <div className={styles.stepNum}>{index + 1}</div>
              <h4>{step.title}</h4>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className={styles.block}>
        <div className={styles.contactBox}>
          <div>
            <h2>{t("contact.title")}</h2>
            <p>{t("contact.description")}</p>
          </div>
          <div className={styles.contactInfo}>
            <div>
              <div className={styles.label}>{t("contact.phoneLabel")}</div>
              <div>0933621222</div>
            </div>
            <div>
              <div className={styles.label}>{t("contact.facebookLabel")}</div>
              <div>https://www.facebook.com/nhung.nguyen.164000</div>
            </div>
            <div>
              <div className={styles.label}>{t("contact.addressLabel")}</div>
              <div>{t("contact.address")}</div>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.brandMini}>
          <img src="/images/logo.jpg" alt="Văn Cô Nhung" />
        </div>
        <div>
          © {new Date().getFullYear()} Văn Cô Nhung. {t("footer.tagline")}
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
