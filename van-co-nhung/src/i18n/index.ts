import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import commonVi from "./locales/vi/common.json";
import authVi from "./locales/vi/auth.json";
import homeVi from "./locales/vi/home.json";
import profileVi from "./locales/vi/profile.json";
import teacherVi from "./locales/vi/teacher.json";
import studentVi from "./locales/vi/student.json";

import commonEn from "./locales/en/common.json";
import authEn from "./locales/en/auth.json";
import homeEn from "./locales/en/home.json";
import profileEn from "./locales/en/profile.json";
import teacherEn from "./locales/en/teacher.json";
import studentEn from "./locales/en/student.json";

export const LANGUAGE_STORAGE_KEY = "language";

function getInitialLanguage(): string {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === "en" ? "en" : "vi";
}

i18n.use(initReactI18next).init({
  resources: {
    vi: { common: commonVi, auth: authVi, home: homeVi, profile: profileVi, teacher: teacherVi, student: studentVi },
    en: { common: commonEn, auth: authEn, home: homeEn, profile: profileEn, teacher: teacherEn, student: studentEn },
  },
  lng: getInitialLanguage(),
  fallbackLng: "vi",
  defaultNS: "common",
  ns: ["common", "auth", "home", "profile", "teacher", "student"],
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

i18n.on("languageChanged", (lng) => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
});

export default i18n;
