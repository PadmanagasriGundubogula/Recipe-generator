import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import logo from './assets/logo.png';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-brand">
                    <Link to="/" className="footer-logo">
                        <img src={logo} alt="RecipeGen Logo" className="footer-logo-img" />
                        <span className="footer-logo-text">RecipeGen</span>
                    </Link>
                    <p className="footer-tagline">
                        Unleashing your culinary creativity with the power of AI.
                    </p>
                </div>

                <div className="footer-links-section">
                    <ul className="footer-links">
                        <li><Link to="/">Home</Link></li>
                        <li><a href="#how-it-works">Instructions</a></li>
                        <li><Link to="/page1">Recipe Tool</Link></li>
                        <li><Link to="/contact">Contact Us</Link></li>
                        <li><Link to="/login">Login</Link></li>
                    </ul>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} RecipeGen. All rights reserved.</p>
                <p className="footer-signature">Made with 💕 by Padma</p>
            </div>
        </footer>
    );
};

export default Footer;
