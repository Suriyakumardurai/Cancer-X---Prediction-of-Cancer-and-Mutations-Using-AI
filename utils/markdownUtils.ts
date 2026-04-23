// utils/markdownUtils.ts

// This is a simplified markdown parser focusing on tables, headings, bold, and lists.
// It's not exhaustive but covers the formats requested from the Gemini API.

const parseTable = (lines: string[]): { tableHtml: string; linesConsumed: number } => {
    const isTableRow = (line: string) => line.trim().startsWith('|');
    const isSeparatorRow = (line: string) => /\|(?:\s*:?-+:?\s*\|)+/.test(line.trim());

    if (lines.length === 0 || !isTableRow(lines[0])) {
        return { tableHtml: '', linesConsumed: 0 };
    }

    const tableLines: string[] = [];
    for (const line of lines) {
        if (isTableRow(line)) {
            tableLines.push(line);
        } else {
            break;
        }
    }

    // A valid table must have a header and at least one data row.
    if (tableLines.length < 2) {
        return { tableHtml: '', linesConsumed: 0 };
    }
    
    const splitRow = (row: string) => row.split('|').map(cell => cell.trim()).slice(1, -1);

    const headerCells = splitRow(tableLines[0]);
    const numColumns = headerCells.length;
    if (numColumns === 0) return { tableHtml: '', linesConsumed: 0 };

    let tableHtml = '<div class="table-container"><table>';
    // Render header
    tableHtml += '<thead><tr>';
    headerCells.forEach(header => {
        tableHtml += `<th>${header.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</th>`;
    });
    tableHtml += '</tr></thead>';

    // Render body
    tableHtml += '<tbody>';
    for (let i = 1; i < tableLines.length; i++) {
        const line = tableLines[i];
        if (isSeparatorRow(line)) continue;

        const cells = splitRow(line);
        if (cells.every(cell => cell === '')) continue; // Skip empty rows

        tableHtml += '<tr>';
        for (let j = 0; j < numColumns; j++) {
            const cellContent = (cells[j] || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            tableHtml += `<td>${cellContent}</td>`;
        }
        tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table></div>';
    
    return { tableHtml, linesConsumed: tableLines.length };
};


export const renderMarkdown = (text: string | undefined): string => {
    if (!text) return '';

    // Fix for literal '\n' strings returned by the AI
    const normalizedText = text.replace(/\\n/g, '\n');
    const lines = normalizedText.split('\n');
    let html = '';
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Headings (##, ###, ####)
        const headingMatch = line.match(/^(#{2,4})\s(.*)/);
        if (headingMatch) {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            const level = headingMatch[1].length;
            const content = headingMatch[2].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Use h2, h3, h4 which are styled
            html += `<h${level}>${content}</h${level}>`;
            continue;
        }

        // Tables
        if (line.trim().startsWith('|')) {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            const { tableHtml, linesConsumed } = parseTable(lines.slice(i));
            if (linesConsumed > 0) {
                html += tableHtml;
                i += linesConsumed - 1; // Advance the loop
                continue;
            }
        }

        // Unordered Lists
        const listItemMatch = line.match(/^(\s*)[\-\*] (.*)/);
        if (listItemMatch) {
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            const content = listItemMatch[2].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            html += `<li>${content}</li>`;
            continue;
        }

        // End of list
        if (inList && !listItemMatch) {
            html += '</ul>';
            inList = false;
        }

        // Paragraphs and bold text
        if (line.trim().length > 0) {
            const paragraphContent = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            html += `<p>${paragraphContent}</p>`;
        }
    }

    if (inList) {
        html += '</ul>';
    }

    return html;
};
