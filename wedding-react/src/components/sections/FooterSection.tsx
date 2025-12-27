import React from 'react'
import './FooterSection.css'

const currentYear = new Date().getFullYear()
const appVersion = import.meta.env.VITE_APP_VERSION ?? '1.0.0'

export default function FooterSection() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-meta">
          <span>© {currentYear} AI Wedding Planner OS</span>
          <span className="dot" aria-hidden="true">•</span>
          <span>Version {appVersion}</span>
        </div>
        <div className="footer-links">
          <a href="mailto:support@wedding-os.com" aria-label="문의 메일">
            문의: support@wedding-os.com
          </a>
          <span className="dot" aria-hidden="true">•</span>
          <span>Made with ❤️ for couples</span>
        </div>
      </div>
    </footer>
  )
}

