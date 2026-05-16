import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { unzipSync, strFromU8 } from 'fflate';
import HushhTechHeader from '../../components/hushh-tech-header/HushhTechHeader';

type DocumentBlock =
  | { type: 'heading'; text: string }
  | { type: 'list-item'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'table'; rows: string[][] };

const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function getWordAttr(node: Element, localName: string): string {
  return (
    node.getAttributeNS(WORD_NS, localName) ||
    node.getAttribute(`w:${localName}`) ||
    node.getAttribute(localName) ||
    ''
  );
}

function extractParagraphText(node: Element): string {
  let text = '';

  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType !== Node.ELEMENT_NODE) {
      continue;
    }

    const element = child as Element;
    const localName = element.localName;

    if (localName === 't') {
      text += element.textContent || '';
      continue;
    }

    if (localName === 'tab') {
      text += '\t';
      continue;
    }

    if (localName === 'br' || localName === 'cr') {
      text += '\n';
      continue;
    }

    text += extractParagraphText(element);
  }

  return text.replace(/\n{3,}/g, '\n\n').trim();
}

function parseDocxDocument(xml: string): DocumentBlock[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const body = doc.getElementsByTagNameNS(WORD_NS, 'body')[0];

  if (!body) {
    return [];
  }

  const blocks: DocumentBlock[] = [];

  for (const child of Array.from(body.children)) {
    if (child.localName === 'p') {
      const text = extractParagraphText(child);
      if (!text) {
        continue;
      }

      const paragraphStyle = child.getElementsByTagNameNS(WORD_NS, 'pStyle')[0];
      const styleId = paragraphStyle ? getWordAttr(paragraphStyle, 'val') : '';
      const isListItem = child.getElementsByTagNameNS(WORD_NS, 'numPr').length > 0;
      const isHeading =
        /^Heading/i.test(styleId) ||
        /^Title/i.test(styleId) ||
        /^Subtitle/i.test(styleId);

      if (isHeading) {
        blocks.push({ type: 'heading', text });
        continue;
      }

      if (isListItem) {
        blocks.push({ type: 'list-item', text });
        continue;
      }

      blocks.push({ type: 'paragraph', text });
      continue;
    }

    if (child.localName === 'tbl') {
      const rows = Array.from(child.children)
        .filter((row) => row.localName === 'tr')
        .map((row) =>
          Array.from(row.children)
            .filter((cell) => cell.localName === 'tc')
            .map((cell) => {
              const parts = Array.from(cell.children)
                .filter((cellChild) => cellChild.localName === 'p')
                .map((paragraph) => extractParagraphText(paragraph))
                .filter(Boolean);

              return parts.join('\n');
            })
        )
        .filter((row) => row.some(Boolean));

      if (rows.length > 0) {
        blocks.push({ type: 'table', rows });
      }
    }
  }

  return blocks;
}

const DocumentViewerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [blocks, setBlocks] = useState<DocumentBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const documentUrl = searchParams.get('src') || '';
  const title = searchParams.get('title') || 'Fund Document';

  useEffect(() => {
    let cancelled = false;

    const loadDocument = async () => {
      if (!documentUrl) {
        setError('Missing document URL.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(documentUrl);
        if (!response.ok) {
          throw new Error(`Failed to load document: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const files = unzipSync(new Uint8Array(buffer));
        const documentFile = files['word/document.xml'];

        if (!documentFile) {
          throw new Error('Unsupported document format.');
        }

        const parsedBlocks = parseDocxDocument(strFromU8(documentFile));

        if (!cancelled) {
          setBlocks(parsedBlocks);
          setIsLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to open document.');
          setIsLoading(false);
        }
      }
    };

    void loadDocument();

    return () => {
      cancelled = true;
    };
  }, [documentUrl]);

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-slate-900">
      <HushhTechHeader />
      <main className="mx-auto max-w-4xl px-6 pb-16 pt-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Document Reader</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
          </div>
          <a
            href={documentUrl}
            download
            className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black/80"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-base">
              download
            </span>
            Download Original
          </a>
        </div>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          {isLoading ? (
            <div
              className="flex min-h-[240px] flex-col items-center justify-center gap-3"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <p className="sr-only">Loading document...</p>
              <div
                aria-hidden="true"
                className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"
              />
            </div>
          ) : error ? (
            <div
              role="alert"
              className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              {error}
            </div>
          ) : (
            <div className="space-y-5">
              {blocks.map((block, index) => {
                if (block.type === 'heading') {
                  return (
                    <h2 key={`${block.type}-${index}`} className="text-xl font-semibold leading-tight text-slate-950">
                      {block.text}
                    </h2>
                  );
                }

                if (block.type === 'list-item') {
                  return (
                    <p key={`${block.type}-${index}`} className="pl-5 text-[15px] leading-7 text-slate-700">
                      <span className="mr-2 text-slate-400" aria-hidden="true">•</span>
                      {block.text}
                    </p>
                  );
                }

                if (block.type === 'table') {
                  return (
                    <div key={`${block.type}-${index}`} className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <tbody className="divide-y divide-slate-100">
                          {block.rows.map((row, rowIndex) => (
                            <tr key={`row-${rowIndex}`} className="align-top">
                              {row.map((cell, cellIndex) => (
                                <td key={`cell-${rowIndex}-${cellIndex}`} className="whitespace-pre-wrap px-4 py-3 text-slate-700">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                return (
                  <p key={`${block.type}-${index}`} className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
                    {block.text}
                  </p>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default DocumentViewerPage;
