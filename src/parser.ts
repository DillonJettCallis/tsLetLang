import { AssignmentEx, Expression, FunctionEx, IdentifierEx, ModuleEx, Token, TokenType } from './ast';
import { Lexer } from './lexer';


export class Parser {

  private index: number = 0;

  constructor(private tokens: Token[]) {
  }

  public static parseFile(path: string): ModuleEx {
    return Parser.parseModule(Lexer.lexFile(path));
  }

  public static parseModule(tokens: Token[]): ModuleEx {
    const parser = new Parser(tokens);
    return parser.parseModule();
  }

  private expectType(type: TokenType, message: string): Token {
    const next = this.tokens[this.index++];

    if (next.type === type) {
      return next;
    } else {
      return next.loc.error(`Syntax error. Expected ${message} but found ${next.word}`);
    }
  }

  private expectExact(word: string): void | never {
    const next = this.tokens[this.index++];

    if (next.word !== word) {
      return next.loc.error(`Syntax error. Expected '${word}' but found ${next.word}`);
    }
  }

  private checkType(type: TokenType): Token | null {
    const next = this.tokens[this.index];

    if (next.type === type) {
      this.index++;
      return next;
    } else {
      return null;
    }
  }
  private checkExact(word: string): Token | null {
    const next = this.tokens[this.index];

    if (next.word === word) {
      this.index++;
      return next;
    } else {
      return null;
    }
  }


  private parseModule(): ModuleEx {
    const module: ModuleEx = {
      functions: []
    };

    while (this.tokens.length > this.index) {
      if (this.checkType('EOF')) {
        return module;
      } else {
        this.expectExact('fun');
        module.functions.push(this.parseFunction());
      }
    }

    throw new Error('Invalid token stream. No EOF!');
  }

  private parseFunction(): FunctionEx {
    // Assume we have already parsed the 'fun' keyword.
    const loc = this.tokens[this.index - 1].loc;

    const identifier = this.expectType('identifier', 'function name').word;
    this.expectExact('(');
    const params: string[] = [];

    const firstParam = this.checkType('identifier');

    if (firstParam) {
      params.push(firstParam.word);

      while (this.checkExact(',')) {
        params.push(this.expectType('identifier', 'parameter').word);
      }
    }
    this.expectExact( ')');
    this.expectExact( '=');
    const body = this.parseExpression();

    return {
      type: 'function',
      loc,
      identifier,
      params,
      body
    };
  }

  private parseExpression(): Expression {
    if (this.checkExact('fun')) {
      return this.parseFunction();
    } else if (this.checkExact('val')) {
      return this.parseAssignment();
    } else if(this.checkExact('if')) {
      return this.parseIf();
    } else {
      return this.parseCompare();
    }
  }

  private parseAssignment(): AssignmentEx {
    // Assume we have already parsed the 'val' keyword
    const loc = this.tokens[this.index - 1].loc;
    const identifier = this.expectType('identifier', 'value name').word;
    this.expectExact('=');
    const body = this.parseExpression();

    return {
      type: 'assignment',
      loc,
      identifier,
      body
    };
  }

  private parseIf(): Expression {
    // Assume we have already parsed the 'if' keyword
    const loc = this.tokens[this.index - 1].loc;

    this.expectExact('(');
    const condition = this.parseExpression();
    this.expectExact(')');
    const thenBlock = this.parseExpression();
    let elseBLock: Expression | undefined;

    if (this.checkExact('else')) {
      elseBLock = this.parseExpression();
    }

    return {
      type: 'if',
      loc,
      condition,
      thenBlock,
      elseBLock
    };
  }

  private parseCompare(): Expression {
    const left = this.parseSum();

    const next = this.tokens[this.index];

    if (['==', '!=', '<=', '>=', '<', '>'].includes(next.word)) {
      this.index++;
      return {
        type: 'call',
        loc: next.loc,
        func: {
          type: 'identifier',
          loc: next.loc,
          name: `Core.${next.word}`
        },
        args: [left, this.parseSum()]
      };
    } else {
      return left;
    }
  }

  private parseSum(): Expression {
    const left = this.parseProd();

    const next = this.tokens[this.index];

    if (['+', '-'].includes(next.word)) {
      this.index++;
      return {
        type: 'call',
        loc: next.loc,
        func: {
          type: 'identifier',
          loc: next.loc,
          name: `Core.${next.word}`
        },
        args: [left, this.parseProd()]
      };
    } else {
      return left;
    }
  }

  private parseProd(): Expression {
    const left = this.parseCall();

    const next = this.tokens[this.index];

    if (['*', '/'].includes(next.word)) {
      this.index++;
      return {
        type: 'call',
        loc: next.loc,
        func: {
          type: 'identifier',
          loc: next.loc,
          name: `Core.${next.word}`
        },
        args: [left, this.parseCall()]
      };
    } else {
      return left;
    }
  }

  private parseCall(): Expression {
    const func = this.parseBlock();

    if (this.checkExact('(')) {
      const args: Expression[] = [];

      if (this.checkExact(')')) {
        return {
          type: 'call',
          loc: func.loc,
          func,
          args
        };
      }

      const firstArg = this.parseExpression();

      args.push(firstArg);

      while (this.checkExact(',')) {
        args.push(this.parseExpression());
      }

      this.expectExact( ')');

      return {
        type: 'call',
        loc: func.loc,
        func,
        args
      };
    } else {
      return func;
    }
  }

  private parseBlock(): Expression {
    const open = this.checkExact('{');
    if (open) {
      const loc = open.loc;
      const body: Expression[] = [];

      while (!this.checkExact('}')) {
        body.push(this.parseExpression());
      }

      return {
        type: 'block',
        loc,
        body
      };
    } else {
      return this.parseArrayLiteral();
    }
  }

  private parseArrayLiteral(): Expression {
    const open = this.checkExact('[');
    if (open) {
      const args: Expression[] = [];

      const func = {
        type: 'identifier',
          loc: open.loc,
          name: 'List.build'
      } as IdentifierEx;

      if (this.checkExact(']')) {
        return {
          type: 'call',
          loc: open.loc,
          func,
          args
        };
      }

      const firstArg = this.parseExpression();

      args.push(firstArg);

      while (this.checkExact(',')) {
        args.push(this.parseExpression());
      }

      this.expectExact( ']');

      return {
        type: 'call',
        loc: func.loc,
        func,
        args
      };
    } else {
      return this.parseTerm();
    }
  }

  private parseTerm(): Expression {
    const next = this.tokens[this.index++];

    if (next.type === 'stringLiteral') {
      return {
        type: 'literal',
        loc: next.loc,
        value: next.word
      };
    } else if (next.type === 'numberLiteral') {
      try {
        const value = parseFloat(next.word);

        return {
          type: 'literal',
          loc: next.loc,
          value
        };
      } catch (e) {
        return next.loc.error(`Invalid number literal ${next.word}`);
      }
    } else if (next.type === 'module') {
      return {
        type: 'identifier',
        loc: next.loc,
        name: next.word
      };
    } else if (next.type === 'identifier') {
      return {
        type: 'identifier',
        loc: next.loc,
        name: next.word
      };
    } else {
      return next.loc.error(`Syntax error. Expected term but found '${next.word}'`);
    }
  }


}

