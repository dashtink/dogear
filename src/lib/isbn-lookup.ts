export interface BookMetadata {
  title:              string;
  author:             string | null;
  coverUrl:           string | null;
  publisher:          string | null;
  year:               number | null;
  description:        string | null;
  pageCount:          number | null;
  subjects:           string | null;   // JSON array string
  language:           string | null;
  firstPublishedYear: number | null;
  ratingsAverage:     string | null;
  ratingsCount:       number | null;
}

function coerceDescription(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw !== null && "value" in raw) return String((raw as { value: unknown }).value);
  return null;
}

async function fetchOpenLibrarySearch(isbn: string): Promise<{
  description:        string | null;
  firstPublishedYear: number | null;
  ratingsAverage:     string | null;
  ratingsCount:       number | null;
  worksKey:           string | null;
}> {
  try {
    const url = `https://openlibrary.org/search.json?isbn=${isbn}&fields=key,description,first_publish_year,ratings_average,ratings_count&limit=1`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return { description: null, firstPublishedYear: null, ratingsAverage: null, ratingsCount: null, worksKey: null };
    const data = await res.json();
    const doc = data.docs?.[0];
    if (!doc) return { description: null, firstPublishedYear: null, ratingsAverage: null, ratingsCount: null, worksKey: null };
    return {
      description:        coerceDescription(doc.description),
      firstPublishedYear: doc.first_publish_year ?? null,
      ratingsAverage:     doc.ratings_average != null ? doc.ratings_average.toFixed(2) : null,
      ratingsCount:       doc.ratings_count ?? null,
      worksKey:           doc.key ?? null,
    };
  } catch {
    return { description: null, firstPublishedYear: null, ratingsAverage: null, ratingsCount: null, worksKey: null };
  }
}

async function fetchWorksSubjects(worksKey: string): Promise<string[]> {
  try {
    const res = await fetch(`https://openlibrary.org${worksKey}.json`, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.subjects) ? data.subjects.slice(0, 10) : [];
  } catch {
    return [];
  }
}

export async function fetchByISBN(isbn: string): Promise<BookMetadata | null> {
  // Fetch enriched data (description, ratings, first publish year) in parallel with base data
  const [searchData] = await Promise.all([fetchOpenLibrarySearch(isbn)]);

  // 1. Try OpenLibrary data endpoint for base metadata
  try {
    const olUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
    const olRes = await fetch(olUrl, { next: { revalidate: 86400 } });
    if (olRes.ok) {
      const olData = await olRes.json();
      const key = `ISBN:${isbn}`;
      if (olData[key]) {
        const book = olData[key];

        // Pull subjects — prefer works endpoint, fallback to data endpoint
        const worksKey: string | null = searchData.worksKey ?? book.works?.[0]?.key ?? null;
        const dataSubjects: string[] = Array.isArray(book.subjects)
          ? book.subjects.slice(0, 10).map((s: { name: string }) => s.name)
          : [];

        let allSubjects = dataSubjects;
        if (allSubjects.length === 0 && worksKey) {
          allSubjects = await fetchWorksSubjects(worksKey);
        }

        const lang: string | null = book.languages?.[0]?.key
          ? book.languages[0].key.replace("/languages/", "")
          : null;

        // Use first sentence as fallback description if search API has none
        const excerpt = book.excerpts?.find((e: { first_sentence?: boolean; text: string }) => e.first_sentence)?.text ?? null;
        const description = searchData.description ?? coerceDescription(book.description) ?? excerpt;

        return {
          title:              book.title,
          author:             book.authors?.[0]?.name ?? null,
          coverUrl:           book.cover?.large ?? book.cover?.medium ?? null,
          publisher:          book.publishers?.[0]?.name ?? null,
          year:               book.publish_date ? parseInt(book.publish_date) : null,
          description,
          pageCount:          book.number_of_pages ?? null,
          subjects:           allSubjects.length > 0 ? JSON.stringify(allSubjects) : null,
          language:           lang,
          firstPublishedYear: searchData.firstPublishedYear,
          ratingsAverage:     searchData.ratingsAverage,
          ratingsCount:       searchData.ratingsCount,
        };
      }
    }
  } catch { /* fall through to Google Books */ }

  // 2. Fall back to Google Books
  try {
    const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
    const gbRes = await fetch(gbUrl, { next: { revalidate: 86400 } });
    if (gbRes.ok) {
      const gbData = await gbRes.json();
      const info = gbData.items?.[0]?.volumeInfo;
      if (info) {
        return {
          title:              info.title,
          author:             info.authors?.[0] ?? null,
          coverUrl:           info.imageLinks?.thumbnail?.replace("http:", "https:") ?? null,
          publisher:          info.publisher ?? null,
          year:               info.publishedDate ? parseInt(info.publishedDate) : null,
          description:        info.description ?? searchData.description ?? null,
          pageCount:          info.pageCount ?? null,
          subjects:           info.categories?.length ? JSON.stringify(info.categories) : null,
          language:           info.language ?? null,
          firstPublishedYear: searchData.firstPublishedYear,
          ratingsAverage:     searchData.ratingsAverage,
          ratingsCount:       searchData.ratingsCount,
        };
      }
    }
  } catch { /* both failed */ }

  return null;
}

export function normalizeISBN(raw: string): string {
  const stripped = raw.replace(/[-\s]/g, "");
  if (stripped.length === 10) {
    const digits = stripped.slice(0, 9);
    const sum = ("978" + digits).split("").reduce((acc, d, i) => acc + parseInt(d) * (i % 2 === 0 ? 1 : 3), 0);
    const check = (10 - (sum % 10)) % 10;
    return "978" + digits + check;
  }
  return stripped;
}
