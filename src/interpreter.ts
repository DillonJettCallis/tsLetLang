import { Expression, Location, ModuleEx } from './ast';
import { buildLibrary } from './library';
import { Parser } from './parser';


export class Interpreter {

  public static interpretFile(path: string) {
    this.interpretModule(Parser.parseFile(path));
  }

  public static interpretModule(module: ModuleEx) {
    const lib = buildLibrary();
    const interpreter = new Interpreter();
    const moduleScope = new Context(lib);

    for (const fun of module.functions) {
      interpreter.interpret(fun, moduleScope);
    }

    const main = moduleScope.get('main', new Location('', 1, 1));

    main();
  }

  private interpret(node: Expression, context: Context): any {
    switch (node.type) {
      case 'literal':
        return node.value;
      case 'identifier':
        return context.get(node.name, node.loc);
      case 'block': {
        const newScope = new Context(context);
        let result: any = null;

        for (const next of node.body) {
          result = this.interpret(next, newScope);
        }

        return result;
      }
      case 'if': {
        if (this.interpret(node.condition, context)) {
          return this.interpret(node.thenBlock, context);
        } else {
          if (node.elseBLock) {
            return this.interpret(node.elseBLock, context);
          } else {
            return null;
          }
        }
      }
      case 'assignment': {
        const result = this.interpret(node.body, context);
        context.set(node.identifier, result);
        return result;
      }
      case 'call': {
        const func = this.interpret(node.func, context);

        if (typeof func !== 'function') {
          return node.func.loc.error(`Attempt to call non-function '${func}'`);
        }

        const args = node.args.map(arg => this.interpret(arg, context));

        return func(...args);
      }
      case 'function': {
        const parentScope = context;
        const params = node.params;
        const body = node.body;

        const func = (...args: any[]) => {
          const childScope = new Context(parentScope);

          for (let i = 0; i < params.length; i++) {
            // If the lengths aren't the same that's fine.
            // We can just set params to undefined and it will cause no issue.
            childScope.set(params[i], args[i]);
          }

          return this.interpret(body, childScope);
        };

        context.set(node.identifier, func);

        return func;
      }
    }
  }
}

export class Context {

  private readonly scope = new Map<string, any>();

  constructor(private parent?: Context) {
  }

  get(id: string, loc: Location): any {
    if (this.scope.has(id)) {
      return this.scope.get(id);
    } else {
      if (this.parent) {
        return this.parent.get(id, loc);
      } else {
        return loc.error(`Variable ${id} is not defined`);
      }
    }
  }

  set(id: string, value: any): void {
    this.scope.set(id, value);
  }

}
