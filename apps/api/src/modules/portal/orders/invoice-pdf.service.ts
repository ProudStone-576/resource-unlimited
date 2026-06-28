import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PDFDocument from 'pdfkit';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

interface InvoiceForPdf {
  number: string;
  status: string;
  issuedAt: Date | null;
  dueAt: Date | null;
  currency: string;
  subtotal: { toString(): string };
  taxTotal: { toString(): string };
  grandTotal: { toString(): string };
  billing: {
    companyName: string;
    line1: string;
    line2?: string | null;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  items: {
    productSku: string;
    productName: string;
    quantity: number;
    unitPrice: { toString(): string };
    lineTotal: { toString(): string };
  }[];
}

@Injectable()
export class InvoicePdfService {
  private readonly logger = new Logger(InvoicePdfService.name);
  private readonly storageDir: string;
  private readonly publicBase: string;

  constructor(private readonly config: ConfigService) {
    this.storageDir =
      this.config.get<string>('INVOICE_PDF_DIR') ?? join(process.cwd(), 'storage', 'invoices');
    this.publicBase = (
      this.config.get<string>('INVOICE_PDF_PUBLIC_BASE') ?? '/static/invoices'
    ).replace(/\/$/, '');
  }

  async generate(invoice: InvoiceForPdf): Promise<{ filePath: string; publicUrl: string }> {
    await fs.mkdir(this.storageDir, { recursive: true });
    const filename = `${invoice.number}.pdf`;
    const filePath = join(this.storageDir, filename);
    await this.writePdf(invoice, filePath);
    const publicUrl = `${this.publicBase}/${filename}`;
    this.logger.log(`Generated invoice PDF ${publicUrl}`);
    return { filePath, publicUrl };
  }

  private writePdf(invoice: InvoiceForPdf, filePath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const fsLib = require('node:fs') as typeof import('node:fs');
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
      const stream = fsLib.createWriteStream(filePath);
      doc.pipe(stream);
      this.render(doc, invoice);
      doc.end();
      stream.on('finish', () => resolve());
      stream.on('error', (err) => reject(err));
    });
  }

  private render(doc: PDFKit.PDFDocument, inv: InvoiceForPdf): void {
    const brand = '#1f3458';
    const muted = '#5e687c';
    const dark = '#0f141f';

    doc.rect(0, 0, doc.page.width, 90).fill(brand);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22).text('Resources Unlimited', 50, 32);
    doc.font('Helvetica').fontSize(10).text('Invoice', 50, 60);
    doc
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(24)
      .text('INVOICE', 0, 28, { align: 'right', width: doc.page.width - 50 });
    doc.font('Helvetica').fontSize(10).text(inv.number, 0, 60, { align: 'right', width: doc.page.width - 50 });

    const metaTop = 110;
    doc.fillColor(dark).font('Helvetica-Bold').fontSize(11).text('Bill to', 50, metaTop);
    doc.font('Helvetica').fillColor(dark).fontSize(11).text(inv.billing.companyName, 50, metaTop + 16);
    doc.fillColor(muted).fontSize(10).text(inv.billing.line1, 50, metaTop + 32);
    if (inv.billing.line2) doc.text(inv.billing.line2, 50, metaTop + 46);
    doc.text(
      `${inv.billing.city}, ${inv.billing.province} ${inv.billing.postalCode}`,
      50,
      metaTop + (inv.billing.line2 ? 60 : 46),
    );

    const rightX = doc.page.width - 250;
    doc.fillColor(dark).font('Helvetica-Bold').fontSize(11).text('Details', rightX, metaTop);
    doc
      .font('Helvetica')
      .fillColor(muted)
      .fontSize(10)
      .text(`Issued: ${(inv.issuedAt ?? new Date()).toISOString().slice(0, 10)}`, rightX, metaTop + 16);
    if (inv.dueAt) doc.text(`Due: ${inv.dueAt.toISOString().slice(0, 10)}`, rightX, metaTop + 30);
    doc.text(`Status: ${inv.status}`, rightX, metaTop + 44);
    doc.text(`Currency: ${inv.currency}`, rightX, metaTop + 58);

    const tableTop = 220;
    doc.rect(50, tableTop, doc.page.width - 100, 24).fill(brand);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
    doc.text('SKU', 60, tableTop + 8);
    doc.text('Description', 160, tableTop + 8);
    doc.text('Qty', 0, tableTop + 8, { align: 'right', width: doc.page.width - 250 });
    doc.text('Unit', 0, tableTop + 8, { align: 'right', width: doc.page.width - 170 });
    doc.text('Line', 0, tableTop + 8, { align: 'right', width: doc.page.width - 70 });

    let rowY = tableTop + 30;
    doc.font('Helvetica').fillColor(dark).fontSize(10);
    for (const it of inv.items) {
      if (rowY > doc.page.height - 140) {
        doc.addPage();
        rowY = 60;
      }
      doc.fillColor(dark).text(it.productSku, 60, rowY, { width: 90 });
      doc.text(it.productName, 160, rowY, { width: 200 });
      doc.text(String(it.quantity), 0, rowY, { align: 'right', width: doc.page.width - 250 });
      doc.text(it.unitPrice.toString(), 0, rowY, { align: 'right', width: doc.page.width - 170 });
      doc.text(it.lineTotal.toString(), 0, rowY, { align: 'right', width: doc.page.width - 70 });
      rowY += 20;
      doc.strokeColor('#e6edf6').lineWidth(0.5).moveTo(50, rowY - 4).lineTo(doc.page.width - 50, rowY - 4).stroke();
    }

    const totalsX = doc.page.width - 220;
    const startY = rowY + 14;
    doc.fillColor(muted).font('Helvetica').fontSize(10);
    doc.text('Subtotal', totalsX, startY);
    doc.fillColor(dark).text(`${inv.currency} ${inv.subtotal.toString()}`, 0, startY, {
      align: 'right',
      width: doc.page.width - 60,
    });
    doc.fillColor(muted).text('Tax', totalsX, startY + 16);
    doc.fillColor(dark).text(`${inv.currency} ${inv.taxTotal.toString()}`, 0, startY + 16, {
      align: 'right',
      width: doc.page.width - 60,
    });
    doc.fillColor(dark).font('Helvetica-Bold').fontSize(12).text('Total', totalsX, startY + 36);
    doc.text(`${inv.currency} ${inv.grandTotal.toString()}`, 0, startY + 36, {
      align: 'right',
      width: doc.page.width - 60,
    });

    doc
      .fillColor(muted)
      .font('Helvetica')
      .fontSize(9)
      .text('Resources Unlimited · sales@resourcesunlimited.ca · +1 (800) 555-0199', 50, doc.page.height - 50);
  }
}
