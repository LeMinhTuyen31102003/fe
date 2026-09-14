import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './LoginPage.module.css'
import { apiUrl } from './teacher/apiClient'

function ForgotPasswordPage() {
  const { t } = useTranslation('auth')
  const [username, setUsername] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [formError, setFormError] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    setSentTo('')

    if (!username.trim()) {
      setFieldError(t('usernameRequired'))
      return
    }
    setFieldError('')

    setIsSubmitting(true)
    try {
      const res = await fetch(apiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      })

      if (!res.ok) {
        // Each failure mode has its own status so the message stays localized here.
        if (res.status === 404) setFormError(t('forgot.userNotFound'))
        else if (res.status === 423) setFormError(t('forgot.accountDisabled'))
        else if (res.status === 409) setFormError(t('forgot.noEmail'))
        else if (res.status === 503) setFormError(t('forgot.mailUnavailable'))
        else setFormError(t('forgot.failed'))
        return
      }

      const data = await res.json()
      setSentTo(data.maskedEmail)
      setUsername('')
    } catch {
      setFormError(t('connectionError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <Link to="/login" className={styles.backHome}>
        ← {t('forgot.backToLogin')}
      </Link>

      <div className={styles.card}>
        <img src="/images/logo.jpg" alt="Văn Cô Nhung" className={styles.logo} />
        <h1 className={styles.heading}>{t('forgot.title')}</h1>
        <p className={styles.subheading}>{t('forgot.subtitle')}</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {formError && <div className={styles.formError}>{formError}</div>}
          {sentTo && (
            <div className={styles.formSuccess}>{t('forgot.success', { email: sentTo })}</div>
          )}

          <div className={styles.field}>
            <label htmlFor="username">
              {t('username')} <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrap}>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={fieldError ? styles.inputError : ''}
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            {fieldError && <span className={styles.fieldError}>{fieldError}</span>}
          </div>

          <p className={styles.helperText}>{t('forgot.hint')}</p>

          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? t('forgot.submitting') : t('forgot.submit')}
          </button>
        </form>

        <p className={styles.footerNote}>
          {t('forgot.footerNote')}
          <br />
          {t('contactSupportBefore')} <strong>0933621222</strong> {t('contactSupportAfter')}
        </p>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
