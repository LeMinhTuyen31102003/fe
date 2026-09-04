import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from './LoginPage.module.css'
import { apiUrl } from './teacher/apiClient'

interface FieldErrors {
  username?: string
  password?: string
}

function LoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation('auth')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validate(): boolean {
    const errors: FieldErrors = {}
    if (!username.trim()) errors.username = t('usernameRequired')
    if (!password) errors.password = t('passwordRequired')
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        setFormError(res.status === 401 ? t('invalidCredentials') : t('loginFailed'))
        return
      }

      const data = await res.json()
      localStorage.setItem('token', data.token)
      localStorage.setItem('userName', data.userName)
      localStorage.setItem('fullName', data.fullName ?? '')
      localStorage.setItem('role', data.role)
      navigate(data.role === 'TEACHER' ? '/admin' : '/')
    } catch {
      setFormError(t('connectionError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.backHome}>
        ← {t('backToHome')}
      </Link>

      <div className={styles.card}>
        <img src="/images/logo.jpg" alt="Văn Cô Nhung" className={styles.logo} />
        <h1 className={styles.heading}>{t('title')}</h1>
        <p className={styles.subheading}>{t('subtitle')}</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {formError && <div className={styles.formError}>{formError}</div>}

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
                className={fieldErrors.username ? styles.inputError : ''}
                disabled={isSubmitting}
              />
            </div>
            {fieldErrors.username && (
              <span className={styles.fieldError}>{fieldErrors.username}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="password">
              {t('password')} <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrap}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldErrors.password ? styles.inputError : ''}
                disabled={isSubmitting}
              />
              <button
                type="button"
                className={styles.toggleVisibility}
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? t('hidePassword') : t('showPassword')}
              </button>
            </div>
            {fieldErrors.password && (
              <span className={styles.fieldError}>{fieldErrors.password}</span>
            )}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? t('submitting') : t('submit')}
          </button>
        </form>

        <p className={styles.footerNote}>
          {t('noAccount')}
          <br />
          {t('contactSupportBefore')} <strong>0933621222</strong> {t('contactSupportAfter')}
        </p>
      </div>
    </div>
  )
}

export default LoginPage
