import React from 'react';
import styled from 'styled-components';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

/* ─── Styled Components ──────────────────────────────────────────────────────── */

const NavWrap = styled.nav`
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  border: 1px solid var(--border-color);
  padding: 12px 24px;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  z-index: 50;

  @media (max-width: 768px) {
    padding: 12px 16px;
    top: 16px;
  }
`;

const NavInner = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;
  width: 100%;
  justify-content: space-between;
`;

const Logo = styled(Link)`
  font-family: 'Geist', monospace;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-primary);
  text-decoration: none;
`;

const NavLinks = styled.div`
  display: none;
  align-items: center;
  gap: 32px;

  @media (min-width: 768px) {
    display: flex;
  }
`;

const NavLink = styled(Link)`
  font-family: 'Geist', monospace;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ $active }) => $active ? 'var(--color-primary)' : 'var(--color-secondary)'};
  text-decoration: none;
  border-bottom: ${({ $active }) => $active ? '1px solid var(--border-color)' : '1px solid transparent'};
  padding-bottom: 2px;

  &:hover {
    color: var(--color-primary);
  }
`;

const NavRight = styled.div`
  display: flex;
  align-items: center;
`;

const ContrastButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  transition: transform 0.1s ease;

  &:active {
    transform: scale(0.95);
  }

  .material-symbols-outlined {
    font-size: 22px;
    color: var(--color-primary);
  }
`;

/* ─── Component ──────────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { to: '/',         label: 'Home' },
  { to: '/about',    label: 'About' },
  { to: '/agent',    label: 'Agent' },
  { to: '/exchange', label: 'Exchange' },
  { to: '/mint',     label: 'NFT Minting' },
];

export default function FluidNav() {
  const location = useLocation();
  const { toggleTheme } = useTheme();

  return (
    <NavWrap>
      <NavInner>
        <Logo to="/">SPECTRA</Logo>

        <NavLinks>
          {NAV_LINKS.map(({ to, label }) => {
            const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
            return (
              <NavLink key={to} to={to} $active={isActive}>
                {label}
              </NavLink>
            );
          })}
        </NavLinks>

        <NavRight>
          <ContrastButton
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle light/dark theme"
          >
            <span className="material-symbols-outlined">contrast</span>
          </ContrastButton>
        </NavRight>
      </NavInner>
    </NavWrap>
  );
}
