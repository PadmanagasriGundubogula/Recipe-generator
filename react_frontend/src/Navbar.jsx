import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import logo from './assets/logo.png';

const Navbar = ({ lang, handleLangChange, isLoggedIn, handleLogout }) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const scrollToSection = (id) => {
        if (location.pathname === '/') {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            navigate(`/#${id}`);
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-logo-row">
                    <Link to="/" className="navbar-logo" onClick={() => setIsMenuOpen(false)}>
                        <img src={logo} alt="RecipeGen Logo" className="logo-img" />
                        <span className="logo-text">RecipeGen</span>
                    </Link>

                    <button
                        className={`hamburger ${isMenuOpen ? 'active' : ''}`}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle navigation"
                    >
                        <span className="bar"></span>
                        <span className="bar"></span>
                        <span className="bar"></span>
                    </button>
                </div>

                <div className={`nav-menu-container ${isMenuOpen ? 'open' : ''}`}>
                    <div className="nav-menu">
                        <Link to="/" className="nav-item" onClick={() => { scrollToSection('home'); setIsMenuOpen(false); }}>Home</Link>
                        <a href="#about" className="nav-item" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About Us</a>
                        <a href="#how-it-works" className="nav-item" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); setIsMenuOpen(false); }}>Instructions</a>
                        <a href="#generate" className="nav-item" onClick={(e) => { e.preventDefault(); scrollToSection('generate'); setIsMenuOpen(false); }}>Recipe Tool</a>
                        {isLoggedIn && <Link to="/history" className="nav-item" onClick={() => setIsMenuOpen(false)}>Recipe History</Link>}
                        <a href="#contact" className="nav-item" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact Us</a>
                    </div>

                    <div className="nav-actions">
                        <div className="lang-switcher">
                            <span className="lang-icon">🌐</span>
                            <select
                                value={lang}
                                onChange={handleLangChange}
                                className="lang-select"
                            >
                                <option value="en">English</option>
                                <option value="hi">Hindi</option>
                            </select>
                        </div>

                        {!isLoggedIn && (
                            <button className="get-started-btn" onClick={() => { navigate('/login'); setIsMenuOpen(false); }}>
                                Get Started
                            </button>
                        )}

                        {isLoggedIn && (
                            <button className="logout-btn" onClick={() => {
                                if (window.confirm("Are you sure you want to logout?")) {
                                    if (window.confirm("This will end your session. Are you absolutely sure?")) {
                                        handleLogout();
                                        setIsMenuOpen(false);
                                    }
                                }
                            }}>
                                Logout
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
