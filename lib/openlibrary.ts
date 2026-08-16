export interface OpenLibraryResult {
  title: string;
  author: string | null;
  cover_url: string | null;
  page_count: number | null;
  isbn: string | null;
  edition: string | null;
  publication_info: string | null;
}

// Open Library's search API is free and requires no API key or signup.
// Docs: https://openlibrary.org/dev/docs/api/search
export async function searchOpenLibrary(
  title: string,
  author?: string
): Promise<OpenLibraryResult[]> {
  const params = new URLSearchParams({
    title,
    limit: '5',
  });
  if (author) params.set('author', author);

  const res = await fetch(`https://openlibrary.org/search.json?${params.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();

  return (data.docs || []).map((doc: any) => {
    const coverId = doc.cover_i;
    const isbn = Array.isArray(doc.isbn) ? doc.isbn[0] : null;
    return {
      title: doc.title || title,
      author: Array.isArray(doc.author_name) ? doc.author_name.join(', ') : author || null,
      cover_url: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null,
      page_count: doc.number_of_pages_median || null,
      isbn,
      edition: doc.edition_count ? `${doc.edition_count} editions on record` : null,
      publication_info: doc.first_publish_year ? `First published ${doc.first_publish_year}` : null,
    };
  });
}

export interface ArticleMetadata {
  title: string | null;
  site: string | null;
}

// Open Library's search endpoint often omits page count entirely — it's
// only reliably present on the per-edition record. When a result has an
// ISBN but no page count, this looks the edition up directly to fill it in.
export async function fetchPageCountByIsbn(isbn: string): Promise<number | null> {
  try {
    const res = await fetch(`https://openlibrary.org/isbn/${encodeURIComponent(isbn)}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.number_of_pages === 'number' ? data.number_of_pages : null;
  } catch {
    return null;
  }
}

// Lightweight article metadata extraction: pulls the <title> tag and
// hostname from the page. No paid API involved. Extraction happens via
// our own Next.js API route to avoid CORS issues fetching arbitrary sites
// from the browser.
export async function extractArticleMetadata(url: string): Promise<ArticleMetadata> {
  try {
    const res = await fetch(`/api/extract-article?url=${encodeURIComponent(url)}`);
    if (!res.ok) return { title: null, site: null };
    return await res.json();
  } catch {
    return { title: null, site: null };
  }
}
