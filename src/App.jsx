import React, { useState } from 'react';
import RawDeckInputCleaner from './RawDeckInputCleaner';
import CardTypeChecker from './CardTypeChecker';

function App() {
  const [cleanedCards, setCleanedCards] = useState([]);

  return (
    <div>
      <h1>🧙 Deck Assistant</h1>

      <RawDeckInputCleaner onCleaned={setCleanedCards} />

      {/* ✅ Send cleaned cards directly to type checker */}
      {cleanedCards.length > 0 && (
        <CardTypeChecker cardList={cleanedCards} />
      )}
    </div>
  );
}

export default App;
