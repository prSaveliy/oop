import type { DecodeResult, TableData } from './table_types.ts';

/**
 * Pure Delimited ASCII (TSV) codec supporting UTF-8 / Windows-1251 decoding,
 * empty cells, CRLF/LF line endings, and ragged row normalization.
 */
export class TsvCodec {
  private static readonly utf8Decoder = new TextDecoder('utf-8', {
    fatal: true,
  });
  private static readonly cp1251Decoder = new TextDecoder('windows-1251');

  /** Decodes raw file bytes as UTF-8, falling back to Windows-1251 on invalid UTF-8 sequences. */
  decodeBuffer(bytes: Uint8Array): DecodeResult {
    try {
      const text = this.stripBom(TsvCodec.utf8Decoder.decode(bytes));
      return { text, encoding: 'utf-8' };
    } catch {
      const text = this.stripBom(TsvCodec.cp1251Decoder.decode(bytes));
      return { text, encoding: 'windows-1251' };
    }
  }

  /** Parses Delimited ASCII text (line 1 = headers, lines 2..N = rows) into TableData. */
  parse(content: string): TableData {
    const lines = this.splitLines(this.stripBom(content));
    if (lines.every(line => line.trim() === '' && !line.includes('\t'))) {
      throw new Error('Файл порожній або не містить даних таблиці.');
    }

    const headerLine = lines[0] ?? '';

    const headers = headerLine.split('\t');
    const rawRows = lines.slice(1).map(line => line.split('\t'));
    return this.normalizeRows(headers, rawRows);
  }

  /** Serializes TableData into a valid tab-delimited UTF-8 string. */
  serialize(data: TableData): string {
    if (data.headers.length === 0) {
      return '';
    }

    const columnCount = data.headers.length;
    const headerLine = data.headers.map(h => this.sanitizeField(h)).join('\t');
    const rowLines = data.rows.map(row => {
      const normalized: string[] = [];
      for (let i = 0; i < columnCount; i += 1) {
        normalized.push(this.sanitizeField(row[i] ?? ''));
      }
      return normalized.join('\t');
    });

    return `${[headerLine, ...rowLines].join('\n')}\n`;
  }

  private stripBom(text: string): string {
    return text.startsWith('\uFEFF') ? text.slice(1) : text;
  }

  private splitLines(content: string): string[] {
    const lines = content.split(/\r?\n/);
    while (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop();
    }
    return lines;
  }

  private normalizeRows(headers: string[], rawRows: string[][]): TableData {
    let maxWidth = headers.length;
    for (const row of rawRows) {
      if (row.length > maxWidth) {
        maxWidth = row.length;
      }
    }

    const normalizedHeaders = [...headers];
    while (normalizedHeaders.length < maxWidth) {
      normalizedHeaders.push(`Стовпчик ${normalizedHeaders.length + 1}`);
    }

    const normalizedRows = rawRows.map(row => {
      const padded: string[] = [];
      for (let i = 0; i < maxWidth; i += 1) {
        padded.push(row[i] ?? '');
      }
      return padded;
    });

    return {
      headers: normalizedHeaders,
      rows: normalizedRows,
    };
  }

  private sanitizeField(value: string): string {
    return value.replace(/[\t\r\n]/g, ' ');
  }
}
