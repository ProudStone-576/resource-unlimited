import Link from 'next/link';
import { Container, Section, Button } from '@ru/ui';

export default function NotFound() {
  return (
    <Container>
      <Section heading="Page not found" description="The page you were looking for doesn't exist or has been moved.">
        <Link href="/"><Button>Back to home</Button></Link>
      </Section>
    </Container>
  );
}
