import React from 'react';
import styled from 'styled-components';
import GlassTerminal from '../components/agent/GlassTerminal';

const PageWrap = styled.main`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120px 16px 64px;
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
`;

const DotBg = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 24px 24px;

  [data-theme='light'] & {
    background-image: radial-gradient(circle at 50% 50%, rgba(9, 9, 11, 0.03) 1px, transparent 1px);
  }
`;

export default function Agent() {
  return (
    <PageWrap className="bg-grid-overlay">
      <DotBg />
      <GlassTerminal />
    </PageWrap>
  );
}
