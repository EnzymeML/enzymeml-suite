import React from 'react';
import Latex from 'react-latex-next';
import 'katex/dist/katex.css';
import { asciiToLatex } from '../utilities/equationutils';

interface LatexRendererProps {
    equation: string;
    size?: 'small' | 'normal' | 'large' | 'tiny';
    inline?: boolean;
    className?: string;
    style?: React.CSSProperties;
    convertAsciiToLatex?: boolean;
    coloredSymbolsMap?: ColoredSymbolsMapProps[];
}

export interface ColoredSymbolsMapProps {
    symbols: string[];
    color: string;
}

export default function LatexRenderer({
    equation,
    size = 'normal',
    inline = false,
    className = '',
    style = {},
    convertAsciiToLatex = true,
    coloredSymbolsMap = []
}: LatexRendererProps) {
    // Convert ASCII equation to LaTeX format
    let latexEquation = equation;
    if (convertAsciiToLatex) {
        latexEquation = asciiToLatex(equation);
    }

    // Apply colors to specific symbols
    if (coloredSymbolsMap.length > 0) {
        // Create a flat array of all symbols with their colors for sorting
        const allSymbolMappings = coloredSymbolsMap.flatMap(colorGroup =>
            colorGroup.symbols.map(symbol => ({
                symbol,
                color: colorGroup.color
            }))
        );

        // Sort by symbol length (descending) to handle longer symbols first
        // This prevents partial replacements (e.g., replacing "k" before "kcat")
        allSymbolMappings.sort((a, b) => b.symbol.length - a.symbol.length);

        // Apply colors to each symbol
        allSymbolMappings.forEach(({ symbol, color }) => {
            // Escape special regex characters in the symbol
            const latexSymbol = asciiToLatex(symbol);
            const escapedSymbol = latexSymbol.replace(/[.*+?^$()|[\]\\]/g, '\\$&');

            // Create a regex that matches the symbol more precisely
            let regex;

            // Special handling for bracketed species (e.g., [species_id])
            if (symbol.startsWith('[') && symbol.endsWith(']')) {
                // For bracketed species, match exactly as they appear
                regex = new RegExp(escapedSymbol, 'g');
            } else if (latexSymbol.includes('_') || latexSymbol.includes('^')) {
                // For symbols with subscripts/superscripts, match the exact pattern
                regex = new RegExp(`(?<!\\w)${escapedSymbol}(?!\\w|_|\\^)`, 'g');
            } else if (latexSymbol.startsWith('\\')) {
                // For LaTeX commands like \alpha, \beta, etc.
                regex = new RegExp(`${escapedSymbol}(?!\\w)`, 'g');
            } else {
                // For regular symbols, use word boundaries
                regex = new RegExp(`\\b${escapedSymbol}\\b`, 'g');
            }

            // Replace with colored version using LaTeX \textcolor command
            latexEquation = latexEquation.replace(regex, `\\textcolor{${color}}{${latexSymbol}}`);
        });
    }

    // Size mapping
    const sizeMap = {
        small: '\\normalsize',
        normal: '\\large',
        large: '\\Large',
        tiny: '\\tiny'
    };

    // Format the LaTeX string without global color (since we're applying specific colors)
    // If no colored symbols are provided, fall back to blue color
    const hasColoredSymbols = coloredSymbolsMap.length > 0;
    const formattedLatex = inline
        ? `$ ${sizeMap[size]} ${hasColoredSymbols ? '' : ''}${latexEquation} $`
        : `$$ ${sizeMap[size]} ${hasColoredSymbols ? '' : ''}${latexEquation} $$`;

    return (
        <div
            className={`flex justify-center items-center ${className}`}
            style={style}
        >
            <Latex>{formattedLatex}</Latex>
        </div>
    );
} 