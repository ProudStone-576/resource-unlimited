import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PDFDocument from 'pdfkit';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

interface QuoteForPdf {
  number: string;
  status: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  country: string | null;
  notes: string | null;
  validUntil: Date | null;
  totalEstimate: { toString(): string } | null;
  currency: string;
  createdAt: Date;
  items: {
    productSku: string;
    productName: string;
    quantity: number;
    notes: string | null;
  }[];
}

@Injectable()
export class QuotePdfService {
  private readonly logger = new Logger(QuotePdfService.name);
  private readonly storageDir: string;
  private readonly publicBase: string;

  constructor(private readonly config: ConfigService) {
    this.storageDir = this.config.get<string>('QUOTE_PDF_DIR') ?? join(process.cwd(), 'storage', 'quotes');
    this.publicBase = (this.config.get<string>('QUOTE_PDF_PUBLIC_BASE') ?? '/static/quotes').replace(/\/$/, '');
  }

  /** Generate PDF, write to disk, return the public URL. */
  async generate(quote: QuoteForPdf): Promise<{ filePath: string; publicUrl: string }> {
    await fs.mkdir(this.storageDir, { recursive: true });
    const filename = `${quote.number}.pdf`;
    const filePath = join(this.storageDir, filename);
    await this.writePdfToFile(quote, filePath);
    const publicUrl = `${this.publicBase}/${filename}`;
    this.logger.log(`Generated PDF ${publicUrl}`);
    return { filePath, publicUrl };
  }

  private writePdfToFile(quote: QuoteForPdf, filePath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const fs = require('node:fs') as typeof import('node:fs');
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      this.renderPdf(doc, quote);
      doc.end();
      stream.on('finish', () => resolve());
      stream.on('error', (err) => reject(err));
    });
  }

  private renderPdf(doc: PDFKit.PDFDocument, q: QuoteForPdf): void {
    const brand = '#1f3458';
    const accent = '#ff7a18';
    const muted = '#5e687c';
    const dark = '#0f141f';

    // Header
    doc.rect(0, 0, doc.page.width, 90).fill(brand);
    doc
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(22)
      .text('Resources Unlimited', 50, 32, { align: 'left' });
    doc.font('Helvetica').fontSize(10).text('Authorized Canadian distributor of Grafico Packaging', 50, 60);

    doc
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(24)
      .text('QUOTE', 0, 28, { align: 'right', width: doc.page.width - 50 });
    doc.font('Helvetica').fontSize(10).text(q.number, 0, 60, { align: 'right', width: doc.page.width - 50 });

    doc.moveDown(4);

    // Meta block
    const metaTop = 110;
    doc.fillColor(dark).font('Helvetica-Bold').fontSize(11).text('Prepared for', 50, metaTop);
    doc.font('Helvetica').fillColor(dark).fontSize(11).text(q.companyName, 50, metaTop + 16);
    doc.fillColor(muted).fontSize(10).text(`${q.contactName} <${q.contactEmail}>`, 50, metaTop + 32);
    if (q.contactPhone) doc.text(q.contactPhone, 50, metaTop + 46);

    const loc = [q.city, q.province, q.postalCode, q.country].filter(Boolean).join(', ');
    if (loc) doc.text(loc, 50, metaTop + 60);

    const rightX = doc.page.width - 250;
    doc.fillColor(dark).font('Helvetica-Bold').fontSize(11).text('Quote details', rightX, metaTop);
    doc
      .font('Helvetica')
      .fillColor(muted)
      .fontSize(10)
      .text(`Issued: ${q.createdAt.toISOString().slice(0, 10)}`, rightX, metaTop + 16);
    if (q.validUntil) doc.text(`Valid until: ${q.validUntil.toISOString().slice(0, 10)}`, rightX, metaTop + 30);
    doc.text(`Status: ${q.status}`, rightX, metaTop + 44);
    doc.text(`Currency: ${q.currency}`, rightX, metaTop + 58);

    // Items table
    const tableTop = 210;
    doc.rect(50, tableTop, doc.page.width - 100, 24).fill(brand);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
    doc.text('SKU', 60, tableTop + 8);
    doc.text('Description', 160, tableTop + 8);
    doc.text('Qty', 0, tableTop + 8, { align: 'right', width: doc.page.width - 70 });

    let rowY = tableTop + 30;
    doc.font('Helvetica').fillColor(dark).fontSize(10);

    for (const it of q.items) {
      if (rowY > doc.page.height - 120) {
        doc.addPage();
        rowY = 60;
      }
      doc.fillColor(dark).text(it.productSku, 60, rowY, { width: 90 });
      doc.text(it.productName, 160, rowY, { width: 280 });
      doc.text(String(it.quantity), 0, rowY, { align: 'right', width: doc.page.width - 70 });
      if (it.notes) {
        rowY += 14;
        doc.fillColor(muted).fontSize(9).text(`Note: ${it.notes}`, 160, rowY, { width: 280 });
        doc.fontSize(10);
      }
      rowY += 22;
      doc.strokeColor('#e6edf6').lineWidth(0.5).moveTo(50, rowY - 6).lineTo(doc.page.width - 50, rowY - 6).stroke();
    }

    // Totals
    if (q.totalEstimate) {
      doc
        .fillColor(dark)
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(`Estimated total: ${q.currency} ${q.totalEstimate.toString()}`, 0, rowY + 14, {
          align: 'right',
          width: doc.page.width - 60,
        });
    } else {
      doc
        .fillColor(muted)
        .font('Helvetica-Oblique')
        .fontSize(10)
        .text('Pricing will be added by your account representative.', 50, rowY + 14);
    }

    // Notes
    if (q.notes) {
      doc.moveDown(2);
      doc.fillColor(dark).font('Helvetica-Bold').fontSize(11).text('Notes', 50);
      doc.font('Helvetica').fillColor(dark).fontSize(10).text(q.notes, 50);
    }

    // Footer
    doc
      .fillColor(accent)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('Resources Unlimited', 50, doc.page.height - 60);
    doc
      .fillColor(muted)
      .font('Helvetica')
      .fontSize(9)
      .text('sales@resourcesunlimited.ca   •   +1 (800) 555-0199', 50, doc.page.height - 46);
  }
}
