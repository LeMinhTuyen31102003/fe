import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './LoginPage.module.css'

interface FieldErrors {
  username?: string
  password?: string
}

function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validate(): boolean {
    const errors: FieldErrors = {}
    if (!username.trim()) errors.username = 'Vui lòng nhập tên đăng nhập'
    if (!password) errors.password = 'Vui lòng nhập mật khẩu'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        setFormError(
          res.status === 401
            ? 'Tên đăng nhập hoặc mật khẩu không đúng.'
            : 'Đăng nhập thất bại. Vui lòng thử lại.',
        )
        return
      }

      const data = await res.json()
      localStorage.setItem('userName', data.userName)
      localStorage.setItem('role', data.role)
      navigate('/')
    } catch {
      setFormError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.backHome}>
        ← Về trang chủ
      </Link>

      <div className={styles.card}>
        <img src="/images/logo.jpg" alt="Văn Cô Nhung" className={styles.logo} />
        <h1 className={styles.heading}>Đăng nhập</h1>
        <p className={styles.subheading}>
          Đăng nhập để vào trang học tập hoặc trang quản lý
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {formError && <div className={styles.formError}>{formError}</div>}

          <div className={styles.field}>
            <label htmlFor="username">Tên đăng nhập</label>
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
            <label htmlFor="password">Mật khẩu</label>
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
                {showPassword ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
            {fieldErrors.password && (
              <span className={styles.fieldError}>{fieldErrors.password}</span>
            )}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className={styles.footerNote}>
          Chưa có tài khoản? Chỉ giáo viên mới có thể cấp tài khoản học sinh.
          <br />
          Liên hệ <strong>0933621222</strong> để được hỗ trợ.
        </p>
      </div>
    </div>
  )
}

export default LoginPage
