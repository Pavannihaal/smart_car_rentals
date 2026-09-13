import { useState } from "react";
import { Link } from "react-router-dom";
import { vehicles } from "../data/vehicles";

export function HomePage() {
  const featuredCars = vehicles.slice(0, 3);
  const [theme, setTheme] = useState(() => localStorage.getItem("smartcar_theme") || "dark");

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("smartcar_theme", nextTheme);
  };

  return (
    <div className="public-homepage">
      {/* Public Header Bar */}
      <header className="public-navbar">
        <div className="public-nav-brand">
          <span className="logo-icon">🏎️</span>
          <span className="logo-text">SMARTCAR RENTALS</span>
        </div>
        <nav className="public-nav-links">
          <a href="#hero">Home</a>
          <a href="#featured">Explore Cars</a>
          <a href="#about">About</a>
          <button type="button" className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
          <Link className="primary-button nav-login-btn" to="/login">
            Login
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="hero" className="public-hero">
        <div className="hero-content">
          <p className="eyebrow">PREMIUM AUTOMOTIVE MOBILITY</p>
          <h1>Premium cars. Simple rental experience.</h1>
          <p className="hero-subtext">
            Discover curated fleets, dynamic daily rates, and effortless reservations across top urban and airport locations.
          </p>
          <div className="hero-cta-buttons">
            <Link className="primary-button hero-btn-lg" to="/login">
              Explore Cars
            </Link>
            <Link className="secondary-button hero-btn-lg" to="/login">
              Portal Access / Login
            </Link>
          </div>
        </div>
        <div className="hero-visual-card">
          <img
            className="hero-car-image"
            src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=85"
            alt="Premium rental car"
          />
          <div className="car-badge">Featured Luxury Fleet</div>
          <div className="hero-car-info">
            <h3>Toyota Innova Hycross</h3>
            <p>Hybrid Automatic • 7 Seats • Bengaluru Hub</p>
            <div className="car-price-tag">
              <strong>₹5,200</strong> <span>/ day</span>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="public-features-section">
        <div className="section-head">
          <p className="eyebrow">Why Choose SmartCar</p>
          <h2>Crafted for Effortless Travel</h2>
        </div>
        <div className="grid-three">
          <article className="card feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Easy Booking</h3>
            <p>Discover available vehicles with transparent daily rates and instant booking confirmation.</p>
          </article>

          <article className="card feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Flexible Fleet</h3>
            <p>Choose from city sedans to spacious luxury SUVs, all maintained to strict safety standards.</p>
          </article>

          <article className="card feature-card">
            <div className="feature-icon">📊</div>
            <h3>Smart Operations</h3>
            <p>Rental operators manage vehicles using data-driven metrics for optimal maintenance and service.</p>
          </article>
        </div>
      </section>

      {/* Featured Rental Preview Grid */}
      <section id="featured" className="public-preview-section">
        <div className="section-head-split">
          <div>
            <p className="eyebrow">Featured Fleet</p>
            <h2>Explore Popular Rental Vehicles</h2>
          </div>
          <Link className="secondary-button" to="/login">
            View All Fleet »
          </Link>
        </div>

        <div className="grid-three featured-cars-grid">
          {featuredCars.map((car) => (
            <article key={car.vehicle_id} className="card public-car-card">
              <div className="car-card-header">
                <span className="car-category-badge">{car.type}</span>
                <span className={`status-pill status-${car.status === "AVAILABLE" ? "healthy" : "warning"}`}>
                  {car.status}
                </span>
              </div>
              <h3>{car.brand} {car.model}</h3>
              <p className="car-location-text">📍 {car.location_name}, {car.city}</p>
              <div className="car-specs-row">
                <span>⚙️ {car.transmission}</span>
                <span>⛽ {car.fuel_type}</span>
                <span>👥 {car.seats} Seats</span>
              </div>
              <div className="car-card-foot">
                <div className="price-box">
                  <strong>₹{car.price_per_day.toLocaleString("en-IN")}</strong>
                  <span>/ day</span>
                </div>
                <Link className="primary-button" to="/login">
                  View Details
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="public-about-section">
        <article className="card about-card">
          <p className="eyebrow">About SmartCar</p>
          <h2>A Modern Car Rental & Fleet Operations System</h2>
          <p>
            SmartCar Rentals makes vehicle discovery and booking simple for customers while empowering rental-company owners to coordinate fleet operations through data-driven operational insights and explainable recommendations.
          </p>
        </article>
      </section>

      {/* Final CTA Banner */}
      <section className="public-cta-banner">
        <h2>Ready to find your next car?</h2>
        <p>Browse available rental vehicles or log in to manage your account.</p>
        <div className="cta-banner-buttons">
          <Link className="primary-button hero-btn-lg" to="/login">
            Explore Cars
          </Link>
          <Link className="secondary-button hero-btn-lg" to="/login">
            Login
          </Link>
        </div>
      </section>

      {/* Minimal Public Footer */}
      <footer className="public-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <strong>SMARTCAR RENTALS</strong>
            <p>Modern Mobility & Fleet Management</p>
          </div>
          <div className="footer-links">
            <Link to="/login">Explore Cars</Link>
            <Link to="/login">Portal Access</Link>
            <Link to="/login">Rental Owner Login</Link>
          </div>
        </div>
        <div className="footer-copy">
          © {new Date().getFullYear()} SmartCar Rentals. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
