/**
 * Location represents the line and column of a char in a file so that error messages can point the user to the
 * location of the error in the source file.
 */
export class Location {

  constructor(private sourceFile: string, private line: number, private column: number) {
  }

  toString(): string {
    return `${this.line}:${this.column}`;
  }

  error(message: string): never {
    throw new Error(`${message} from ${this.sourceFile} at ${this}`);
  }
}

export type TokenType = 'identifier' | 'module' | 'operator' | 'symbol' | 'keyword' | 'stringLiteral' | 'numberLiteral' | 'EOF';

/**
 * Token represents a single 'word' of source, such as keywords like 'fun' or 'if' to variable names to operators like '+' or '('
 */
export interface Token {
  type: TokenType;
  word: string;
  loc: Location;
}

/**
 * Our language splits code into modules.
 * For now there is no way to import another source module, but if we were to add
 * that later that info would go here.
 */
export interface ModuleEx {
  functions: FunctionEx[];
}

/**
 * These are all the different expression types.
 */
export type Expression = FunctionEx | AssignmentEx | BlockEx | CallEx | IfEx | IdentifierEx | LiteralEx;

/**
 * A function declaration.
 * IE:
 *
 * fun main() = {}
 */
export interface FunctionEx {
  type: 'function';
  loc: Location;
  identifier: string;
  params: string[];
  body: Expression;
}

/**
 * A variable declaration.
 * IE:
 * val x = 5
 */
export interface AssignmentEx {
  type: 'assignment';
  loc: Location;
  identifier: string;
  body: Expression;
}

/**
 * The contents of curly brackets.
 * IE:
 *
 * x * { y + 1}
 */
export interface BlockEx {
  type: 'block';
  loc: Location;
  body: Expression[];
}

/**
 * Calling a function.
 * IE:
 *
 * sum(x, y)
 */
export interface CallEx {
  type: 'call';
  loc: Location;
  func: Expression;
  args: Expression[];
}

/**
 * And if expression.
 * IE:
 *
 * if (condition) {
 *   doThen()
 * } else {
 *   doElse()
 * }
 */
export interface IfEx {
  type: 'if';
  loc: Location;
  condition: Expression;
  thenBlock: Expression;
  elseBLock?: Expression;
}

/**
 * Using a variable.
 * IE:
 * x + 1
 */
export interface IdentifierEx {
  type: 'identifier';
  loc: Location;
  name: string;
}

/**
 * A number or string literal.
 * IE:
 *
 * 'Hello world'
 */
export interface LiteralEx {
  type: 'literal';
  loc: Location;
  value: string | number;
}
