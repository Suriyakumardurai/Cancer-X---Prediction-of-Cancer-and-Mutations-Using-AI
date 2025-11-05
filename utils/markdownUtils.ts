// utils/markdownUtils.ts

// This is a simplified markdown parser focusing on tables, headings, bold, and lists.
// It's not exhaustive but covers the formats requested from the Gemini API.

const parseTable = (lines: string[]): { tableHtml: string; linesConsumed: number } => {
    if (lines.length < 2) return { tableHtml: '', linesConsumed: 0 };
    
    const headerLine = lines[0];
    const separatorLine = lines[1];

    if (!headerLine.includes('|') || !separatorLine.match(/\|(?:\s*:?-+:?\s*\|)+/)) {
        return { tableHtml: '', linesConsumed: 0 };
    }
    
    // Use a regex that properly handles pipes inside backticks (code blocks)
    const splitRow = (row: string) => {
      // This is a simplified split, a full implementation would need to handle escaped pipes.
      return row.split('|').map(h => h.trim()).slice(1, -1); // remove first and last empty string
    };

    const headers = splitRow(headerLine);
    let tableHtml = '<div class="table-container"><table><thead><tr>';
    headers.forEach(header => {
        tableHtml += `<th>${header}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';

    let linesConsumed = 2;
    for (let i = 2; i < lines.length; i++) {
        const rowLine = lines[i];
        if (!rowLine.includes('|')) break;

        const cells = splitRow(rowLine);
        tableHtml += '<tr>';
        // Ensure row has same number of cells as header
        for (let j = 0; j < headers.length; j++) {
            const cellContent = cells[j] || '';
            tableHtml += `<td>${cellContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</td>`;
        }
        tableHtml += '</tr>';
        linesConsumed++;
    }

    tableHtml += '</tbody></table></div>';
    return { tableHtml, linesConsumed };
};


export const renderMarkdown = (text: string | undefined): string => {
    if (!text) return '';

    const lines = text.split('\n');
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
            html += `<h${level + 1}>${content}</h${level + 1}>`;
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
        const listItemMatch = line.match(/^(\s*)\* (.*)/);
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
