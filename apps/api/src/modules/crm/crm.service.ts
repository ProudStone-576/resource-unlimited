import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CrmContact {
  email: string;
  name?: string | null;
  companyName?: string | null;
  source?: string;
}

/**
 * Thin HubSpot Contacts wrapper. If HUBSPOT_API_TOKEN is unset, every
 * method becomes a no-op so dev environments don't need credentials.
 */
@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);
  private readonly token?: string;

  constructor(private readonly config: ConfigService) {
    this.token = this.config.get<string>('HUBSPOT_API_TOKEN') || undefined;
    if (!this.token) this.logger.warn('HubSpot CRM disabled (HUBSPOT_API_TOKEN not set).');
  }

  async upsertContact(contact: CrmContact): Promise<void> {
    if (!this.token) {
      this.logger.log(`[CRM:STUB] upsert ${contact.email} (${contact.source ?? '-'})`);
      return;
    }
    const [firstName, ...rest] = (contact.name ?? '').split(' ');
    const lastName = rest.join(' ');
    const props: Record<string, string | undefined> = {
      email: contact.email,
      firstname: firstName,
      lastname: lastName,
      company: contact.companyName ?? undefined,
      ru_source: contact.source ?? undefined,
    };
    const filtered = Object.fromEntries(
      Object.entries(props).filter(([, v]) => v !== undefined && v !== ''),
    );

    const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ properties: filtered }),
    });
    if (!res.ok && res.status !== 409 /* conflict = already exists */) {
      const text = await res.text().catch(() => '');
      throw new Error(`HubSpot upsert ${res.status}: ${text}`);
    }
  }
}
