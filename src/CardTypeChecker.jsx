import React, { useEffect, useState } from 'react';
import './CardTypeChecker.css';

// Join oracle lines into sentences.
const normalizeOracle = (s) => {
  if (!s) return '';
  return s
    .replace(/\r?\n/g, '\n')
    .split('\n')
    .map(t => t.trim())
    .filter(Boolean)
    .map(t => (/[.!?]$/.test(t) ? t : t + '.'))
    .join(' ');
};

// Base-type extractor from Scryfall type_line
const BASE_TYPES = ['Land', 'Creature', 'Artifact', 'Enchantment', 'Instant', 'Sorcery', 'Planeswalker', 'Battle'];
const stripToBaseTypes = (typeLine) => {
  if (!typeLine) return '';
  const left = typeLine.split('—')[0].trim();
  const words = left.split(/\s+/);
  const kept = words.filter(w => BASE_TYPES.includes(w));
  return kept.join(' ') || left;
};
const getDisplayType = (data) => {
  if (Array.isArray(data.card_faces) && data.card_faces[0]?.type_line) {
    return stripToBaseTypes(data.card_faces[0].type_line);
  }
  return stripToBaseTypes(data.type_line || '');
};

export default function CardTypeChecker({ cardList }) {
  const [annotatedCards, setAnnotatedCards] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const tryFetch = async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (data.object === 'error') throw new Error(data.details || 'Scryfall error');
      return data;
    };

    const fetchOne = async (card) => {
      const name = card['Card Name'];
      try {
        let data;
        try {
          data = await tryFetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`);
        } catch {
          data = await tryFetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`);
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
          'Card Type': getDisplayType(data),              // actual type (e.g., "Creature", "Instant", "Land")
          'Oracle Text': normalizeOracle(rawOracle),
          'Function in the deck': ''
        };
      } catch (err) {
        console.error(`❌ Lookup failed for ${name}:`, err);
        return {
          'Card Name': name,
          'Quantity': card.Quantity,
          'Card Type': '',
          'Oracle Text': '',
          'Function in the deck': ''
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
    return () => { cancelled = true; };
  }, [cardList]);

  // Buckets
  const lands = annotatedCards.filter(c => (c['Card Type'] || '').includes('Land'));
  const nonlands = annotatedCards.filter(c => !(c['Card Type'] || '').includes('Land'));

  // Counters
  const sumQty = (arr) => arr.reduce((n, x) => n + (Number(x.Quantity) || 0), 0);
  const nonlandTotal = sumQty(nonlands);
  const landTotal = sumQty(lands);

  const badgeStyle = {
    fontSize: '0.9rem',
    padding: '2px 8px',
    marginLeft: 8,
    borderRadius: 999,
    border: '1px solid var(--border, #d9dbe3)'
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'));
  };

  return (
    <div>
      {loading && <p>Loading card data…</p>}

      <h2 className="section-title">
        📘 Nonland Cards
        <span style={badgeStyle}>Total: {nonlandTotal} • Unique: {nonlands.length}</span>
      </h2>
      <button className="copy-button" onClick={() => copyToClipboard(JSON.stringify(nonlands, null, 2))}>
        📋 Copy Nonland JSON
      </button>
      <div className="card-output">
        <pre>{JSON.stringify(nonlands, null, 2)}</pre>
      </div>

      <h2 className="section-title">
        🌱 Land Cards
        <span style={badgeStyle}>Total: {landTotal} • Unique: {lands.length}</span>
      </h2>
      <button className="copy-button" onClick={() => copyToClipboard(JSON.stringify(lands, null, 2))}>
        📋 Copy Land JSON
      </button>
      <div className="card-output">
        <pre>{JSON.stringify(lands, null, 2)}</pre>
      </div>
    </div>
  );
}
