import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TsvCodec } from '../src/shared/tsv_codec.ts';

describe('TsvCodec', () => {
  const codec = new TsvCodec();

  it('parses standard TSV with CRLF, empty cells, and trailing tabs', () => {
    const raw =
      'Кафедра\tШифр\tГодин\tЛекцій\r\n' +
      'Обчислювальної техніки\tІІ.1/с\t210\t72\r\n' +
      '\tІІ.3/св\t45\t\r\n';

    const parsed = codec.parse(raw);
    assert.deepEqual(parsed.headers, ['Кафедра', 'Шифр', 'Годин', 'Лекцій']);
    assert.deepEqual(parsed.rows, [
      ['Обчислювальної техніки', 'ІІ.1/с', '210', '72'],
      ['', 'ІІ.3/св', '45', ''],
    ]);
  });

  it('strips UTF-8 BOM and decodes UTF-8 buffers', () => {
    const bomBytes = Buffer.from(
      '\uFEFFНазва\tЗначення\nРядок 1\t10\n',
      'utf-8',
    );
    const decoded = codec.decodeBuffer(bomBytes);
    assert.equal(decoded.encoding, 'utf-8');
    const parsed = codec.parse(decoded.text);
    assert.deepEqual(parsed.headers, ['Назва', 'Значення']);
    assert.deepEqual(parsed.rows, [['Рядок 1', '10']]);
  });

  it('falls back to Windows-1251 when bytes are invalid UTF-8', () => {
    // "Кафедра\tГодин\nОТ\t30\n" encoded in Windows-1251
    const cp1251Bytes = Uint8Array.from([
      0xca, 0xe0, 0xf4, 0xe5, 0xe4, 0xf0, 0xe0, 0x09, 0xc3, 0xee, 0xe4, 0xe8,
      0xed, 0x0a, 0xce, 0xd2, 0x09, 0x33, 0x30, 0x0a,
    ]);
    const decoded = codec.decodeBuffer(cp1251Bytes);
    assert.equal(decoded.encoding, 'windows-1251');
    const parsed = codec.parse(decoded.text);
    assert.deepEqual(parsed.headers, ['Кафедра', 'Годин']);
    assert.deepEqual(parsed.rows, [['ОТ', '30']]);
  });

  it('pads short rows and expands headers for wider rows', () => {
    const raw = 'A\tB\n1\n2\t3\t4\n';
    const parsed = codec.parse(raw);
    assert.deepEqual(parsed.headers, ['A', 'B', 'Стовпчик 3']);
    assert.deepEqual(parsed.rows, [
      ['1', '', ''],
      ['2', '3', '4'],
    ]);
  });

  it('throws on empty input', () => {
    assert.throws(() => codec.parse(''));
    assert.throws(() => codec.parse('   \r\n  \n'));
  });

  it('sanitizes tabs/newlines and roundtrips cleanly', () => {
    const original = {
      headers: ['Колонка\t1', 'Колонка 2'],
      rows: [
        ['Текст\nз переносом', ''],
        ['', 'Значення\tз табом'],
      ],
    };

    const serialized = codec.serialize(original);
    assert.equal(
      serialized,
      'Колонка 1\tКолонка 2\nТекст з переносом\t\n\tЗначення з табом\n',
    );

    const reparsed = codec.parse(serialized);
    assert.deepEqual(reparsed, {
      headers: ['Колонка 1', 'Колонка 2'],
      rows: [
        ['Текст з переносом', ''],
        ['', 'Значення з табом'],
      ],
    });
  });
});
