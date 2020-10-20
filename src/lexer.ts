import { readFileSync } from 'fs';
import { basename, resolve } from 'path';
import { Location, Token, TokenType } from './ast';

const alphaLower = 'abcdefghijklmnopqrstuvwxyz';
const alphaUpper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const alpha = alphaLower + alphaUpper;
const alphaAccess = alpha + '.';
const numericStart = '0123456789';
const numeric = '.' + numericStart;
const alphaNumeric = numericStart + alpha;

const symbols = '()[]{},';
const operators = '<>=+-*/';

const config: {type: TokenType, init: string, body: string}[] = [{
  type: 'identifier',
  init: alphaLower,
  body: alphaNumeric
}, {
  type: 'module',
  init: alphaUpper,
  body: alphaAccess
}, {
  type: 'operator',
  init: operators,
  body: operators
}, {
  type: 'symbol',
  init: symbols,
  body: ''
}, {
  type: 'numberLiteral',
  init: numericStart,
  body: numeric
}];

const keyWords = new Set(['fun', 'val', 'if', 'else']);

export class Lexer {

  private index: number = 0;

  private line: number = 1;
  private column: number = 1;

  constructor(private sourceFile: string, private raw: string) {
  }

  private here() {
    return new Location(this.sourceFile, this.line, this.column);
  }

  /**
   * A single static entry point to parse a whole file at a time.
   * @param path
   */
  static lexFile(path: string): Token[] {
    const file = resolve(path);
    const fileName = basename(file);

    // Read the file into a string.
    const raw = readFileSync(file, {encoding: 'UTF-8'});

    // Create parser and do parse
    const lexer = new Lexer(fileName, raw);
    const result = lexer.lex();

    // Make sure there isn't anything left after the SExpression. IE: no dangling nonsense after the last close parens.
    lexer.eatWhitespace();

    if (lexer.raw.length !== lexer.index) {
      throw new Error(`Expected EOF at ${lexer.line}:${lexer.column}: Found ${lexer.raw[lexer.index]}`);
    } else {
      return result;
    }
  }

  /**
   * Nom nom nom!
   * Advance the index through any whitespace, incrementing line and column as needed.
   * Stops on anything not whitespace.
   */
  private eatWhitespace() {
    while (this.raw.length > this.index) {
      const next = this.raw[this.index];
      if (' \t\r'.indexOf(next) !== -1) {
        // Some whitespace other than newline.
        this.index++;
        this.column++;
      } else if (next === '\n') {
        // A newline
        this.index++;
        this.line++;
        this.column = 1;
      } else {
        // no whitespace left
        return;
      }
    }
  }

  private eatWord(next: string, loc: Location): Token {
    for (const {type, init, body} of config) {
      if (init.includes(next)) {
        let word = next;

        while (body.includes(this.raw[this.index])) {
          word += this.raw[this.index++];
          this.column++;
        }

        if (keyWords.has(word)) {
          return {
            type: 'keyword',
            word,
            loc
          };
        } else {
          return{
            type,
            word,
            loc
          };
        }
      }
    }

    return loc.error(`Invalid character ${next}`);
  }

  private eatString(loc: Location): Token {
    // We are a string literal. Keep going until we find another '"'.
    // We are going to allow multiline strings, but no kind of escapes for the moment.
    let word = '';

    // Until EOF
    while (this.raw.length > this.index) {
      // Next char
      const maybeQuote = this.raw[this.index++];
      this.column++;

      if ('"' !== maybeQuote) {
        // String is not over yet.
        word += maybeQuote;

        if ('\n' === maybeQuote) {
          this.column = 1;
          this.line++;
        }
      } else {
        // Ending quote found.
        return {
          type: 'stringLiteral',
          word,
          loc
        };
      }
    }

    // The string is never closed. We're missing a closing quote.
    return loc.error(`Unexpected EOF at ${this.line}:${this.column}. Unclosed string literal starting`);
  }

  private lex(): Token[] {
    const tokens: Token[] = [];

    while (true) {
      //Start by advancing to the first non-whitespace
      this.eatWhitespace();

      // Create a location of here. Do this now so that our logs will store where something started, not be in the middle of it.
      const loc = this.here();

      // Make sure we aren't at the end yet.
      if (this.raw.length === this.index) {
        tokens.push({
          type: 'EOF',
          word: '',
          loc
        });
        return tokens;
      }

      // Read the next char and advance.
      const next = this.raw[this.index++];
      this.column++;

      if (next === '"') {
        tokens.push(this.eatString(loc));
      } else {
        tokens.push(this.eatWord(next, loc));
      }
    }
  }
}