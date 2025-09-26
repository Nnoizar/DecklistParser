import React, { useEffect, useState } from 'react';
import './CardTypeChecker.css';

function CardTypeChecker({ cardList }) {
  const [annotatedCards, setAnnotatedCards] = useState([]);

  useEffect(() => {
    const fetchCardTypes = async () => {
      const results = [];

      for (const card of cardList) {
        try {
          const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(card["Card Name"])}`);
          const data = await response.json();

          results.push({
            "Card Name": card["Card Name"],
            "Quantity": card.Quantity,
            "Card Type": data.type_line.includes("Land") ? "Land" : "Nonland",
            "Oracle Text": data.oracle_text || ""
          });
        } catch (error) {
          console.error(`❌ Failed to fetch data for ${card["Card Name"]}:`, error);
        }
      }

      setAnnotatedCards(results);
    };

    if (cardList.length > 0) {
      fetchCardTypes();
    }
  }, [cardList]);

  const nonlands = annotatedCards.filter(c => c["Card Type"] === "Nonland");
  const lands = annotatedCards.filter(c => c["Card Type"] === "Land");

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Copied to clipboard!");
    });
  };

  return (
    <div>
      <h2 className="section-title">📘 Nonland Cards with Oracle Text</h2>
      <button className="copy-button" onClick={() => copyToClipboard(JSON.stringify(nonlands, null, 2))}>
        📋 Copy Nonland Cards
      </button>
      <div className="card-output">
        <pre>{JSON.stringify(nonlands, null, 2)}</pre>
      </div>

      <h2 className="section-title">🌱 Land Cards</h2>
      <button className="copy-button" onClick={() => copyToClipboard(JSON.stringify(lands, null, 2))}>
        📋 Copy Land Cards
      </button>
      <div className="card-output">
        <pre>{JSON.stringify(lands, null, 2)}</pre>
      </div>
    </div>
  );
}

export default CardTypeChecker;
