import type { Metadata } from 'next';
import { Container, Section, Card, CardBody, Badge } from '@ru/ui';
import { portalFetch, type MyCompanyDTO } from '@/lib/portal-api';
import { InviteForm } from './InviteForm';

export const metadata: Metadata = {
  title: 'Company',
  robots: { index: false, follow: false },
};

export default async function CompanyPage() {
  const data = await portalFetch<MyCompanyDTO>('/portal/company').catch(() => ({
    company: null,
    role: 'MEMBER',
  } as MyCompanyDTO));

  const canInvite = data.role === 'ADMIN' || data.role === 'OWNER';

  return (
    <Container>
      <Section eyebrow="Portal" heading="Company">
        {!data.company ? (
          <Card><CardBody><p className="text-sm text-steel-600">No company linked to your account.</p></CardBody></Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <Card>
              <CardBody>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-steel-900">{data.company.name}</h3>
                  {data.company.isApproved ? (
                    <Badge tone="success">Approved</Badge>
                  ) : (
                    <Badge tone="warn">Pending approval</Badge>
                  )}
                  <Badge tone="brand">{data.role}</Badge>
                </div>

                <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-steel-500">Members</h4>
                <ul className="divide-y divide-steel-100 rounded-md border border-steel-100">
                  {data.company.members.map((m) => (
                    <li key={m.user.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-steel-900">
                          {[m.user.firstName, m.user.lastName].filter(Boolean).join(' ') || m.user.email}
                        </p>
                        <p className="text-xs text-steel-500">{m.user.email}</p>
                      </div>
                      <Badge tone="neutral">{m.role}</Badge>
                    </li>
                  ))}
                </ul>

                {data.company.invites.length > 0 ? (
                  <>
                    <h4 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-steel-500">
                      Pending invites
                    </h4>
                    <ul className="divide-y divide-steel-100 rounded-md border border-steel-100">
                      {data.company.invites.map((inv) => (
                        <li key={inv.id} className="flex items-center justify-between px-3 py-2 text-sm">
                          <div>
                            <p className="text-steel-900">{inv.email}</p>
                            <p className="text-xs text-steel-500">
                              {inv.role} · expires {new Date(inv.expiresAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge tone="warn">{inv.status}</Badge>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </CardBody>
            </Card>

            {canInvite ? <InviteForm /> : null}
          </div>
        )}
      </Section>
    </Container>
  );
}
