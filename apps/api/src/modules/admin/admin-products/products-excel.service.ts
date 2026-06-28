import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { ProductStatus, UnitOfMeasure } from '@prisma/client';

interface ExportRow {
  sku: string;
  slug: string;
  name: string;
  shortDesc: string | null;
  status: string;
  isFeatured: boolean;
  categorySlug: string;
  brandSlug: string | null;
  unitOfMeasure: string;
  minOrderQty: number;
  listPrice: string | null;
  currency: string;
}

export interface ImportRow {
  sku: string;
  slug?: string;
  name: string;
  shortDesc?: string | null;
  description?: string | null;
  status?: ProductStatus;
  isFeatured?: boolean;
  categorySlug: string;
  brandSlug?: string | null;
  unitOfMeasure?: UnitOfMeasure;
  minOrderQty?: number;
  listPrice?: number | null;
  currency?: string;
}

const COLUMNS = [
  'sku',
  'slug',
  'name',
  'shortDesc',
  'description',
  'status',
  'isFeatured',
  'categorySlug',
  'brandSlug',
  'unitOfMeasure',
  'minOrderQty',
  'listPrice',
  'currency',
] as const;

@Injectable()
export class ProductsExcelService {
  async writeWorkbook(rows: ExportRow[]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Resources Unlimited';
    const ws = wb.addWorksheet('Products');
    ws.columns = COLUMNS.map((key) => ({ header: key, key, width: 22 }));
    ws.getRow(1).font = { bold: true };

    for (const r of rows) ws.addRow(r);

    const out: ExcelJS.Buffer = await wb.xlsx.writeBuffer();
    if (Buffer.isBuffer(out)) return out as Buffer;
    return Buffer.from(out as ArrayBuffer);
  }

  async readWorkbook(buffer: Buffer): Promise<ImportRow[]> {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    const ws = wb.worksheets[0];
    if (!ws) throw new Error('No worksheet in upload');

    const headerRow = ws.getRow(1);
    const colIndex = new Map<string, number>();
    headerRow.eachCell((cell, idx) => {
      const v = String(cell.value ?? '').trim();
      if (v) colIndex.set(v, idx);
    });

    const required = ['sku', 'name', 'categorySlug'] as const;
    for (const k of required) {
      if (!colIndex.has(k)) throw new Error(`Required column missing: ${k}`);
    }

    const rows: ImportRow[] = [];
    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const getStr = (key: string): string | undefined => {
        const idx = colIndex.get(key);
        if (!idx) return undefined;
        const v = row.getCell(idx).value;
        if (v === null || v === undefined) return undefined;
        return String(v).trim();
      };
      const getNum = (key: string): number | undefined => {
        const s = getStr(key);
        if (s === undefined || s === '') return undefined;
        const n = Number(s);
        return Number.isFinite(n) ? n : undefined;
      };
      const getBool = (key: string): boolean | undefined => {
        const s = getStr(key);
        if (s === undefined) return undefined;
        if (/^(true|yes|1|y)$/i.test(s)) return true;
        if (/^(false|no|0|n)$/i.test(s)) return false;
        return undefined;
      };

      const sku = getStr('sku');
      const name = getStr('name');
      const categorySlug = getStr('categorySlug');
      if (!sku && !name && !categorySlug) continue; // skip blank lines

      if (!sku || !name || !categorySlug) {
        throw new Error(`Row ${r}: sku, name, and categorySlug are required`);
      }

      const status = getStr('status') as ProductStatus | undefined;
      const unitOfMeasure = getStr('unitOfMeasure') as UnitOfMeasure | undefined;
      const listPrice = getNum('listPrice');

      rows.push({
        sku,
        slug: getStr('slug'),
        name,
        shortDesc: getStr('shortDesc') ?? null,
        description: getStr('description') ?? null,
        status,
        isFeatured: getBool('isFeatured'),
        categorySlug,
        brandSlug: getStr('brandSlug') ?? null,
        unitOfMeasure,
        minOrderQty: getNum('minOrderQty'),
        listPrice: listPrice ?? null,
        currency: getStr('currency'),
      });
    }
    return rows;
  }
}
