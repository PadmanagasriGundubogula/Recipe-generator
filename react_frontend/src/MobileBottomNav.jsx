import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './MobileBottomNav.css';

function MobileBottomNav() {
    const location = useLocation();
    const isPage3 = location.pathname.includes('page3');

    return (
        <nav className="mobile-bottom-nav">
            <NavLink to="/page1" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span style={{ fontSize: '20px' }}>📖</span>
                <span>Instructions</span>
            </NavLink>
            <NavLink to="/page2" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span style={{ fontSize: '20px' }}>🛠️</span>
                <span>Recipe Tool</span>
            </NavLink>

            {/* Hide 'Next' orb if already on Page 3 */}
            {!isPage3 && (
                <NavLink to="/page3" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <div className="next-btn-orb">
                        <span style={{ fontSize: '20px', color: 'white' }}>➡️</span>
                    </div>
                    <span>Next</span>
                </NavLink>
            )}

            <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span style={{ fontSize: '20px' }}>🕒</span>
                <span>History</span>
            </NavLink>
            <NavLink to="/contact" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span style={{ fontSize: '20px' }}>✉️</span>
                <span>Contact</span>
            </NavLink>
        </nav>
    );
}

export default MobileBottomNav;
