import { type I18n } from '@lingui/core';
import { Column, Container, Row } from '@react-email/components';
import { Link } from 'src/components/Link';
import { ShadowText } from 'src/components/ShadowText';

const footerContainerStyle = {
  marginTop: '12px',
};

type FooterProps = {
  i18n: I18n;
};

export const Footer = ({ i18n }: FooterProps) => {
  return (
    <Container style={footerContainerStyle}>
      <Row>
        <Column>
          <ShadowText>
            <Link
              href="https://blog.avarile.com/"
              value={i18n._('Website')}
              aria-label={i18n._("Visit Cybernetics's website")}
            />
          </ShadowText>
        </Column>
        <Column>
          <ShadowText>
            <Link
              href="https://github.com/Avarile/cybernetics-crm"
              value={i18n._('Github')}
              aria-label={i18n._("Visit Cybernetics's GitHub repository")}
            />
          </ShadowText>
        </Column>
      </Row>
      <ShadowText>Avarile Wang</ShadowText>
    </Container>
  );
};
