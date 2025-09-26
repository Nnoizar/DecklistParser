import React, { useState } from 'react';

function RawDeckInputCleaner({ onCleaned }) {
    const [rawInput, setRawInput] = useState('');
    const [parsedCards, setParsedCards] = useState([]);

    const cleanRawInput = (inputText) => {
        const lines = inputText.split('\n').filter(Boolean);
        return lines.map((line) => {
            const parts = line.trim().split(' ');
            const quantity = parseInt(parts[0]);

            const cardName = line
                .replace(/^\d+\s/, '')              // Remove leading quantity
                .replace(/\s?\(.*?\).*$/, '')       // Remove everything from first ( ... ) to end
                .replace(/\s\*\w\*$/, '')           // Remove *F* or similar if still present
                .trim();

            return {
                "Card Name": cardName,
                "Quantity": quantity
            };
        });
    };

    const handleRawInput = (e) => {
        const inputText = e.target.value;
        setRawInput(inputText);
        const parsed = cleanRawInput(inputText);
        setParsedCards(parsed);
        onCleaned(parsed); // Send result to parent if needed
    };

    return (
        <div>
            <h2>📝 Raw Deck Input (strip to name + quantity)</h2>
            <textarea
                rows={10}
                cols={80}
                value={rawInput}
                onChange={handleRawInput}
                placeholder="Paste raw deck list here..."
                style={{ fontFamily: 'monospace', width: '100%', marginBottom: '1rem' }}
            />
        </div>
    );
}

export default RawDeckInputCleaner;
