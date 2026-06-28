import { Container } from '@ru/ui';

export default function Loading() {
  return (
    <Container>
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-700" />
      </div>
    </Container>
  );
}
