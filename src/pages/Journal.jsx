import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  min-height: 100vh;
  background: #0A0A0B;
  color: #FFFFFF;
  padding: 120px 40px 40px; /* added top padding to account for fixed nav */
  font-family: 'Poppins', sans-serif;
`;

const Header = styled.h1`
  font-size: 2.5rem;
  color: #FFFFFF;
  border-bottom: 1px solid rgba(176, 38, 255, 0.2);
  padding-bottom: 20px;
  margin-bottom: 30px;
  
  span {
    color: #B026FF;
  }
`;

const Content = styled.div`
  display: grid;
  gap: 24px;
`;

const PostCard = styled.article`
  border: 1px solid rgba(176, 38, 255, 0.15);
  background: rgba(10, 10, 11, 0.5);
  padding: 24px;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(176, 38, 255, 0.4);
    box-shadow: 0 4px 20px rgba(176, 38, 255, 0.1);
  }
`;

const PostTitle = styled.h2`
  font-size: 1.5rem;
  margin: 0 0 12px 0;
  color: #FFFFFF;
`;

const PostMeta = styled.div`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 16px;
`;

const PostExcerpt = styled.p`
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin: 0;
`;

export default function Journal() {
  return (
    <Container>
      <Header>Platform <span>Updates</span></Header>
      <Content>
        <PostCard>
          <PostTitle>Spectra V2 Protocol Upgrade</PostTitle>
          <PostMeta>Published on May 22, 2026</PostMeta>
          <PostExcerpt>
            We are thrilled to announce the upcoming launch of Spectra V2, featuring enhanced liquidity pools, advanced charting integration, and significantly reduced gas fees across all supported networks.
          </PostExcerpt>
        </PostCard>
        <PostCard>
          <PostTitle>New Ecosystem Partnerships</PostTitle>
          <PostMeta>Published on May 15, 2026</PostMeta>
          <PostExcerpt>
            Spectra is expanding its reach with strategic partnerships. Discover how our new integrations will empower the next generation of decentralized finance applications.
          </PostExcerpt>
        </PostCard>
      </Content>
    </Container>
  );
}
