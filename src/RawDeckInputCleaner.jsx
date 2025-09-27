import React, { useEffect, useState } from 'react';

export default function RawDeckInputCleaner({ onCleaned, initialText = '' }) {
    const [rawInput, setRawInput] = useState('');
    const [totalCount, setTotalCount] = useState(0); // 👈 total = sum of quantities

    useEffect(() => {
        if (initialText) {
            setRawInput(initialText);
            const parsed = cleanRawInput(initialText);
            onCleaned(parsed);
            setTotalCount(sumQuantities(parsed));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialText]);

    const isFlag = (t) => /^(?:★|\*(?:F|NF|Foil)\*)$/iu.test(t);
    const isNumber = (t) => /^\d+[a-z]?$/iu.test(t);            // 207, 35, 123a
    const isSetNum = (t) => /^[A-Z]{2,6}-?\d+[a-z]?$/u.test(t); // EMN-155, EMN155
    const isSetWord = (t) => /^[A-Z]{2,6}$/u.test(t);            // EMN (when followed by 155)

    const cleanRawInput = (inputText) => {
        return inputText
            .split('\n')
            .map(l => l.trim())
            .filter(l => l && !l.startsWith('#'))
            .map((line) => {
                // quantity at start: "1" or "1x"
                const qtyMatch = line.match(/^\s*(\d+)(?:x)?\s+/i);
                const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
                let rest = qtyMatch ? line.slice(qtyMatch[0].length) : line;

                // remove parenthetical set info like (CMD), (APC)
                rest = rest.replace(/\s*\([^)]*\)\s*/g, ' ').trim();

                // normalize merged patterns like "35★" -> "35 ★"
                rest = rest.replace(/(\d+[a-z]?)(★)/iu, '$1 $2').replace(/\s{2,}/g, ' ').trim();

                // peel trailing metadata tokens
                const tokens = rest.split(/\s+/);
                while (tokens.length) {
                    const last = tokens[tokens.length - 1];

                    if (isFlag(last) || isNumber(last) || isSetNum(last)) {
                        tokens.pop();
                        continue;
                    }

                    // Case: "... EMN 155"
                    if (tokens.length >= 2) {
                        const last2 = tokens[tokens.length - 2];
                        if (isSetWord(last2) && isNumber(last)) {
                            tokens.pop(); // 155
                            tokens.pop(); // EMN
                            continue;
                        }
                    }
                    break;
                }

                const name = tokens.join(' ').replace(/\s{2,}/g, ' ').trim();
                return { 'Card Name': name, 'Quantity': qty };
            });
    };

    const sumQuantities = (arr) => arr.reduce((sum, x) => sum + (Number(x.Quantity) || 0), 0);

    const handleRawInput = (e) => {
        const inputText = e.target.value;
        setRawInput(inputText);
        const parsed = cleanRawInput(inputText);
        onCleaned(parsed);
        setTotalCount(sumQuantities(parsed)); // 👈 update total
    };

    return (
        <div>
            <h2>
                📝 Raw Deck Input (strip to name + quantity)
                {' '}
                <span style={{
                    fontSize: '0.9rem',
                    padding: '2px 8px',
                    marginLeft: 8,
                    borderRadius: 999,
                    border: '1px solid var(--border, #d9dbe3)'
                }}>
                    Total cards: {totalCount}
                </span>
            </h2>

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
