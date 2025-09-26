import React, { useEffect, useState } from 'react';

function RawDeckInputCleaner({ onCleaned, initialText = '' }) {
    const [rawInput, setRawInput] = useState('');

    useEffect(() => {
        if (initialText) {
            setRawInput(initialText);
            onCleaned(cleanRawInput(initialText));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialText]);

    const cleanRawInput = (inputText) => {
        return inputText
            .split('\n')
            .map(l => l.trim())
            .filter(l => l && !l.startsWith('#')) // ignore empty + comment lines
            .map((line) => {
                // quantity at start: "1" or "1x"
                const qtyMatch = line.match(/^\s*(\d+)(?:x)?\s+/i);
                const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
                let namePart = qtyMatch ? line.slice(qtyMatch[0].length) : line;

                // remove parenthetical metadata like (SET) (123) (Promo) etc.
                namePart = namePart.replace(/\s*\([^)]*\)/g, '');

                // remove trailing collector numbers WITH optional flags at the very end:
                //  - " ... 130", " ... 123a", " ... 130 ★", " ... 130 *F*", " ... 130 *NF*", " ... 130 *Foil*"
                // number (optionally with a/b), then any number of flags: ★, *F*, *NF*, *Foil*
                namePart = namePart.replace(/\s+\d+[a-z]?(?:\s*(?:★|\*(?:F|NF|Foil)\*))*\s*$/iu, '');


                // remove a lone trailing flag or star if present (in case number already stripped)
                // (this was the line with the typo — the extra ')' is removed)
                namePart = namePart.replace(/\s*(?:★|\*(?:F|NF|Foil)\*)\s*$/iu, '');

                // collapse spaces
                namePart = namePart.replace(/\s{2,}/g, ' ').trim();

                return { "Card Name": namePart, "Quantity": qty };
            });
    };

    const handleRawInput = (e) => {
        const inputText = e.target.value;
        setRawInput(inputText);
        onCleaned(cleanRawInput(inputText));
    };

    return (
        <div>
            <h2>📝 Raw Deck Input</h2>
            <textarea
                rows={12}
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
