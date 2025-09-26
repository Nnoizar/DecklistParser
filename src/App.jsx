import React, { useEffect, useState } from 'react';
import RawDeckInputCleaner from './RawDeckInputCleaner.jsx';
import CardTypeChecker from './CardTypeChecker.jsx';
import './App.css';

export default function App() {
  const [cleanedCards, setCleanedCards] = useState([]);
  const [sampleText, setSampleText] = useState('');

  // Optional: preload fixtures/sample-deck.txt so the page shows something immediately
  useEffect(() => {
    const url = new URL('./fixtures/sample-deck.txt', import.meta.url);
    fetch(url)
      .then(r => r.text())
      .then(setSampleText)
      .catch(() => { }); // ignore if file missing
  }, []);

  return (
    <div className="app">
      <h1>Decklist Parser</h1>
      <p>Parses the raw text input from manabox and converts it to readable json-structured data. </p>

      <div className="grid">
        <div className="left">
          <RawDeckInputCleaner onCleaned={setCleanedCards} initialText={sampleText} />
        </div>
        <div className="right">
          <CardTypeChecker cardList={cleanedCards} />
        </div>
      </div>
    </div>
  );
}
