import React, { useEffect, useState } from 'react';
import './CardTypeChecker.css';

// Normalize Scryfall oracle text: join lines into sentences.
const normalizeOracle = (s) => {
  if (!s) return '';
  return s
    .replace(/\r?\n/g, '\n')
    .split('\n')
    .map(t => t.trim())
    .filter(Boolean)
    .map(t => (t.endsWith('.') || t.endsWith('!') || t.endsWith('?')) ? t : t + '.')
    .join(' ');
};

export default function CardTypeChecker({ cardList }) {
  const [annotatedCards, setAnnotatedCards] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const tryFetch = async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      if (data.object === 'error') throw new Error(data.details || 'Scryfall error');
      return data;
    };

    const fetchOne = async (card) => {
      const name = card['Card Name'];

      try {
        // 1) exact; 2) fuzzy fallback
        let data;
        try {
          data = await tryFetch(
            `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`
          );
        } catch {
          data = await tryFetch(
            `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`
          );
        }

        const rawOracle =
          data.oracle_text ||
          (Array.isArray(data.card_faces)
            ? data.card_faces.map(f => f?.oracle_text || '').filter(Boolean).join(' // ')
            : '') ||
          '';

        return {
          'Card Name': name,
          'Quantity': card.Quantity,
          'Card Type': (data.type_line || '').includes('Land') ? 'Land' : 'Nonland',
          'Oracle Text': normalizeOracle(rawOracle),
          'Function in the deck': '',
        };
      } catch (err) {
        console.error(`❌ Lookup failed for ${name}:`, err);
        return {
          'Card Name': name,
          'Quantity': card.Quantity,
          'Card Type': 'Nonland',
          'Oracle Text': '',
          'Function in the deck': '',
        };
      }
    };

    const run = async () => {
      if (!cardList?.length) {
        setAnnotatedCards([]);
        return;
      }
      setLoading(true);
      try {
        const results = await Promise.all(cardList.map(fetchOne));
        if (!cancelled) setAnnotatedCards(results);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [cardList]);

  const nonlands = annotatedCards.filter(c => c['Card Type'] === 'Nonland');
  const lands = annotatedCards.filter(c => c['Card Type'] === 'Land');

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  };

  return (
    <div>
      {loading && <p>Loading card data…</p>}

      <h2 className="section-title">📘 Nonland Cards with Oracle Text</h2>
      <p>parsed + annotated results.</p>
      <button
        className="copy-button"
        onClick={() => copyToClipboard(JSON.stringify(nonlands, null, 2))}
      >
        📋 Copy Nonland Cards
      </button>
      <div className="card-output">
        <pre>{JSON.stringify(nonlands, null, 2)}</pre>
      </div>

      <h2 className="section-title">🌱 Land Cards</h2>
      <button
        className="copy-button"
        onClick={() => copyToClipboard(JSON.stringify(lands, null, 2))}
      >
        📋 Copy Land Cards
      </button>
      <div className="card-output">
        <pre>{JSON.stringify(lands, null, 2)}</pre>
      </div>
    </div>
  );
}
