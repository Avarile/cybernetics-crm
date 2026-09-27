import { DatabaseCentreException } from 'src/modules/database-record/exceptions/database-centre.exception';
import { normalizeDatabaseCentreBaseUrl } from 'src/modules/database-record/utils/normalize-database-centre-base-url.util';

describe('normalizeDatabaseCentreBaseUrl', () => {
  it('should strip whitespace, trailing slashes and a trailing /api', () => {
    expect(
      normalizeDatabaseCentreBaseUrl('  https://data.example.com/api/ '),
    ).toBe('https://data.example.com');
  });

  it('should keep a sub-path and port', () => {
    expect(
      normalizeDatabaseCentreBaseUrl('http://data.example.com:3000/teable/'),
    ).toBe('http://data.example.com:3000/teable');
  });

  it.each([
    ['an empty value', ''],
    ['a non-http protocol', 'ftp://data.example.com'],
    ['embedded credentials', 'https://user:secret@data.example.com'],
    ['a query string', 'https://data.example.com?token=abc'],
    ['a fragment', 'https://data.example.com#section'],
    ['an unparsable value', 'not a url'],
  ])('should reject %s', (_description, value) => {
    expect(() => normalizeDatabaseCentreBaseUrl(value)).toThrow(
      DatabaseCentreException,
    );
  });
});
