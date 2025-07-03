"use client"

import { useState } from "react"
import "../styles/components/Footer.css"

const Footer = () => {
  const [showAboutModal, setShowAboutModal] = useState(false)

  const developers = [
    {
      name: "Ariel Jr Banania",
      role: "FullStack Developer - Scrum Master",
      image: "/images/BananiaProfile.png",
      website: "https://ariel-portfolio-chi.vercel.app",
    },
    {
      name: "Patrick Kyle Fabreag",
      role: "FrontEnd Developer",
      image: "/images/FabreagProfile.png",
      website: "https://fabreagportfolio.netlify.app",
    },
    {
      name: "Arvin Paul Falco",
      role: "Leader - FrontEnd Developer",
      image: "/images/FalcoProfile.png",
      website: "https://sojj23.github.io/falco-portfolio1/",
    },
    {
      name: "Sean Andrei Malapit",
      role: "BackEnd Developer",
      image: "/images/MalapitProfile.png",
      website: "https://dreidrey.github.io/portfolio",
    },
    {
      name: "Kiel Ongtengco",
      role: "BackEnd Developer - Documentation",
      image: "/images/OngtengcoProfile.png",
      website: "https://kielportfolio.netlify.app",
    },
    {
      name: "John Kenneth Vargas",
      role: "BackEnd Developer",
      image: "/images/VargasProfile.png",
      website: "https://vargasss.netlify.app",
    },
  ]

  const handleDeveloperClick = (website) => {
    window.open(website, "_blank", "noopener,noreferrer")
  }

  return (
    <>
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            {/* About Section */}
            <div className="footer-section">
              <h3 className="footer-title">ParkMoneyger</h3>
              <p className="footer-description">
                ParkMoneyger is a web-based parking management system designed to streamline the process of 
                assigning parking slots within large-scale facilities such as malls. 
                Built using ReactJS, CSS, and Django, 
                the system enables parking clerks to manually but efficiently assign slots to incoming vehicles, 
                while also providing real-time parking availability to motorists and reporting tools to administrators.
              </p>
            </div>

            {/* Features Section */}
            <div className="footer-section">
              <h4 className="footer-subtitle">Features</h4>
              <ul className="footer-features">
                <li>Real-time Slot Monitoring</li>
                <li>Online Reservations</li>
                <li>Payment Processing</li>
                <li>Administrative Dashboard</li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="footer-bottom">
            <div className="footer-copyright">
              <p>&copy; 2025 ParkMoneyger. All rights reserved. Developed by Team ParkMoneygers.</p>
              <button onClick={() => setShowAboutModal(true)} className="about-us-button">
                About Us
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* About Us Modal */}
      {showAboutModal && (
        <div className="modal-overlay" onClick={() => setShowAboutModal(false)}>
          <div className="about-modal" onClick={(e) => e.stopPropagation()}>
            <div className="about-modal-header">
              <h2 className="about-modal-title">Meet Our Development Team!</h2>
              <button onClick={() => setShowAboutModal(false)} className="about-modal-close">
                ✕
              </button>
            </div>

            <div className="about-modal-content">
              <p className="team-description">
                We are a passionate team of developers who created ParkMoneyger System to revolutionize parking management
                systems. Our diverse skills in frontend, backend, and full-stack development came together to build this
                comprehensive solution.
              </p>

              <div className="developers-grid">
                {developers.map((developer, index) => (
                  <div key={index} className="developer-card" onClick={() => handleDeveloperClick(developer.website)}>
                    <div className="developer-image-container">
                      <img
                        src={developer.image || "/placeholder.svg"}
                        alt={developer.name}
                        className="developer-image"
                        onError={(e) => {
                          e.target.src = "/placeholder.svg?height=120&width=120"
                        }}
                      />
                    </div>
                    <div className="developer-info">
                      <h3 className="developer-name">{developer.name}</h3>
                      <p className="developer-role">{developer.role}</p>
                      <div className="developer-link">
                        <span className="link-icon">🔗</span>
                        <span>View Portfolio</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Footer
