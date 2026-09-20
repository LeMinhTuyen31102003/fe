import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Award,
  Check,
  GraduationCap,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import styles from "./HomePage.module.css";

interface TrackItem {
  badge: string;
  title: string;
  range: string;
  desc: string;
  points: string[];
}

interface TrustItem {
  value: string;
  label: string;
}

interface TitleSegment {
  text: string;
  emphasis: boolean;
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

const TRUST_ICONS = [GraduationCap, Users, Award];
const NAV_LINKS = [
  { href: "#grades", key: "nav.grades" },
  { href: "#pricing", key: "nav.pricing" },
  { href: "#guide", key: "nav.guide" },
  { href: "#contact", key: "nav.contact" },
] as const;

function HomePage() {
  const { isLoggedIn, role } = useAuth();
  const { t } = useTranslation("home");
  const [menuOpen, setMenuOpen] = useState(false);

  if (isLoggedIn && role === "TEACHER") {
    return <Navigate to="/admin" replace />;
  }
  if (isLoggedIn && role === "STUDENT") {
    return <Navigate to="/student" replace />;
  }

  const tracks = t("grades.items", { returnObjects: true }) as TrackItem[];
  const trust = t("hero.trust", { returnObjects: true }) as TrustItem[];
  const scoreBadge = t("hero.scoreBadge", { returnObjects: true }) as TrustItem;
  const titleSegments = t("hero.titleSegments", { returnObjects: true }) as TitleSegment[];
  const plans = t("pricing.plans", { returnObjects: true }) as PricingPlan[];
  const steps = t("guide.steps", { returnObjects: true }) as GuideStep[];
  const footerClasses = t("footer.classesItems", { returnObjects: true }) as string[];
  const footerStudentItems = t("footer.studentsItems", { returnObjects: true }) as string[];
  const address = t("contact.address");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className={styles.page}>
      <div className={styles.utilityBar}>
        <div className={styles.utilityBarMarquee}>
          <div className={styles.utilityBarMarqueeTrack}>
            <span className={styles.utilityBarMarqueeItem}>{t("utilityBar.announcement")}</span>
            <span className={styles.utilityBarMarqueeItem} aria-hidden="true">
              {t("utilityBar.announcement")}
            </span>
          </div>
        </div>
        <div className={styles.utilityBarRight}>
          <a href="tel:0933621222" className={styles.utilityBarItem}>
            <Phone className={styles.utilityBarIcon} aria-hidden="true" />
            0933 621 222
          </a>
          <span className={`${styles.utilityBarItem} ${styles.utilityBarAddress}`}>
            <MapPin className={styles.utilityBarIcon} aria-hidden="true" />
            {address}
          </span>
        </div>
      </div>
      <nav className={styles.navbarCustom}>
        <Link to="/" className={styles.brand} onClick={closeMenu}>
          <img src="/images/logo.jpg" alt="Văn Cô Nhung" />
          <span className={styles.brandText}>
            <span>Văn Cô Nhung</span>
            <span className={styles.brandTagline}>{t("nav.tagline")}</span>
          </span>
        </Link>
        <div
          id="primary-navigation"
          className={menuOpen ? `${styles.navLinks} ${styles.navLinksOpen}` : styles.navLinks}
        >
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={closeMenu}>
              {t(link.key)}
            </a>
          ))}
        </div>
        <div className={styles.navActions}>
          <Link to="/login" className={`${styles.btnOutlineBrand} ${styles.btnOutlineBrandLight}`}>
            {t("nav.login")}
          </Link>
          <a href="#contact" className={styles.btnBrand}>
            {t("nav.ctaTrial")}
          </a>
          <button
            type="button"
            className={styles.menuToggle}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.heroBadge}>{t("hero.tag")}</div>
          <h1>
            {t("hero.titlePrefix")}{" "}
            {titleSegments.map((segment, index) => (
              <span key={`${segment.text}-${index}`}>
                {segment.emphasis ? <em>{segment.text}</em> : segment.text}{" "}
              </span>
            ))}
          </h1>
          <p>{t("hero.description")}</p>

          <div className={styles.heroCta}>
            <a href="#contact" className={`${styles.btnBrand} ${styles.btnLgBrand}`}>
              {t("hero.ctaPrimary")}
              <ArrowRight className={styles.btnIcon} aria-hidden="true" />
            </a>
            <a
              href="#grades"
              className={`${styles.btnOutlineBrand} ${styles.btnOutlineBrandLight} ${styles.btnLgBrand}`}
            >
              {t("hero.ctaSecondary")}
            </a>
          </div>
          <div className={styles.trustBar}>
            {trust.map((item, index) => {
              const Icon = TRUST_ICONS[index] ?? Sparkles;
              return (
                <div key={item.label} className={styles.trustItem}>
                  <span className={styles.trustIconWrap} aria-hidden="true">
                    <Icon className={styles.trustIcon} />
                  </span>
                  <div>
                    <div className={styles.trustValue}>{item.value}</div>
                    <div className={styles.trustLabel}>{item.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.heroPhotoWrap}>
            <img src="/images/banner.jpg" alt={t("hero.imageAlt")} className={styles.heroPhoto} />
            {scoreBadge && (
              <div className={styles.heroFloatBadge}>
                <span className={styles.heroFloatIconWrap} aria-hidden="true">
                  <Star className={styles.heroFloatIcon} />
                </span>
                <div>
                  <div className={styles.heroFloatValue}>{scoreBadge.value}</div>
                  <div className={styles.heroFloatLabel}>{scoreBadge.label}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="grades" className={`${styles.block} ${styles.gradesSection}`}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>
            <span className={styles.sectionTagDot} aria-hidden="true" />
            {t("grades.tag")}
          </div>
          <h2>{t("grades.title")}</h2>
          <p>{t("grades.description")}</p>
        </div>
        <div className={styles.trackGrid}>
          {tracks.map((track) => (
            <div className={styles.trackCard} key={track.title}>
              <div className={styles.trackCardHead}>
                <div className={styles.trackBadge}>{track.badge}</div>
                <div>
                  <h3>{track.title}</h3>
                  <div className={styles.trackRange}>{track.range}</div>
                </div>
              </div>
              <div className={styles.trackCardBody}>
                <p>{track.desc}</p>
                <ul>
                  {track.points.map((point) => (
                    <li key={point}>
                      <Check className={styles.checkIcon} aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className={styles.block}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>
            <span className={styles.sectionTagDot} aria-hidden="true" />
            {t("pricing.tag")}
          </div>
          <h2>{t("pricing.title")}</h2>
          <p>{t("pricing.description")}</p>
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
                    <Check className={styles.checkIcon} aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className={
                  index === 1
                    ? `${styles.btnBrand} ${styles.fullWidth}`
                    : `${styles.btnOutlineBrand} ${styles.btnOutlineBrandLight} ${styles.fullWidth}`
                }
              >
                {t("pricing.cta")}
                <ArrowRight className={styles.btnIcon} aria-hidden="true" />
              </a>
            </div>
          ))}
        </div>
      </section>

      <section id="guide" className={`${styles.block} ${styles.guideSection}`}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>
            <span className={styles.sectionTagDot} aria-hidden="true" />
            {t("guide.tag")}
          </div>
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
            <a className={styles.contactItem} href="tel:0933621222">
              <span className={styles.contactIconWrap} aria-hidden="true">
                <Phone className={styles.contactIcon} />
              </span>
              <span className={styles.contactText}>
                <span className={styles.contactLabel}>{t("contact.phoneLabel")}</span>
                <span className={styles.contactValue}>0933 621 222</span>
              </span>
            </a>
            <a
              className={styles.contactItem}
              href="https://www.facebook.com/nhung.nguyen.164000"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles.contactIconWrap} aria-hidden="true">
                <MessageCircle className={styles.contactIcon} />
              </span>
              <span className={styles.contactText}>
                <span className={styles.contactLabel}>{t("contact.facebookLabel")}</span>
                <span className={styles.contactValue}>facebook.com/nhung.nguyen.164000</span>
              </span>
            </a>
            <a className={styles.contactItem} href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <span className={styles.contactIconWrap} aria-hidden="true">
                <MapPin className={styles.contactIcon} />
              </span>
              <span className={styles.contactText}>
                <span className={styles.contactLabel}>{t("contact.addressLabel")}</span>
                <span className={styles.contactValue}>{address}</span>
              </span>
            </a>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div>
            <div className={styles.brandMini}>
              <img src="/images/logo.jpg" alt="Văn Cô Nhung" />
              <div>
                <div className={styles.footerBrandName}>Văn Cô Nhung</div>
                <div className={styles.footerBrandTagline}>{t("footer.tagline")}</div>
              </div>
            </div>
            <p className={styles.footerDesc}>{t("footer.description")}</p>
          </div>
          <div>
            <div className={styles.footerColHeading}>{t("footer.classesHeading")}</div>
            <div className={styles.footerColList}>
              {footerClasses.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
          <div>
            <div className={styles.footerColHeading}>{t("footer.studentsHeading")}</div>
            <div className={styles.footerColList}>
              {footerStudentItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
          <div>
            <div className={styles.footerColHeading}>{t("footer.contactHeading")}</div>
            <div className={styles.footerColList}>
              <a className={styles.footerContactLink} href="tel:0933621222">
                <Phone className={styles.footerIcon} aria-hidden="true" />
                0933 621 222
              </a>
              <a
                className={styles.footerContactLink}
                href="https://www.facebook.com/nhung.nguyen.164000"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className={styles.footerIcon} aria-hidden="true" />
                facebook.com/nhung.nguyen.164000
              </a>
              <a className={styles.footerContactLink} href={mapsUrl} target="_blank" rel="noopener noreferrer">
                <MapPin className={styles.footerIcon} aria-hidden="true" />
                {address}
              </a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          © {new Date().getFullYear()} Văn Cô Nhung. {t("footer.legal")}
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
