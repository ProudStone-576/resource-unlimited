'use client';

import { Container, Section, Button } from '@ru/ui';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Container>
      <Section
        heading="Something went wrong"
        description="The page failed to render. Please try again or contact our team."
      >
        <Button onClick={reset}>Retry</Button>
      </Section>
    </Container>
  );
}
