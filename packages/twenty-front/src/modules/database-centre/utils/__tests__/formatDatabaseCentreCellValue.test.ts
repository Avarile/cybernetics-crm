import { formatDatabaseCentreCellValue } from '@/database-centre/utils/formatDatabaseCentreCellValue';

describe('formatDatabaseCentreCellValue', () => {
  it('should render missing values as an empty string', () => {
    expect(formatDatabaseCentreCellValue(null)).toBe('');
    expect(formatDatabaseCentreCellValue(undefined)).toBe('');
  });

  it('should keep strings and stringify primitives', () => {
    expect(formatDatabaseCentreCellValue('Acme')).toBe('Acme');
    expect(formatDatabaseCentreCellValue(42)).toBe('42');
    expect(formatDatabaseCentreCellValue(true)).toBe('true');
  });

  it('should join multi-value cells', () => {
    expect(formatDatabaseCentreCellValue(['a', 1, null])).toBe('a, 1, ');
  });

  it('should serialize object cells', () => {
    expect(formatDatabaseCentreCellValue({ title: 'Deal' })).toBe(
      '{"title":"Deal"}',
    );
  });
});
