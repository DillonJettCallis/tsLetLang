import { Context } from './interpreter';

export function buildLibrary(): Context {
  const lib = new Context();

  lib.set('Core.+', (left: any, right: any) => left + right);
  lib.set('Core.-', (left: any, right: any) => left - right);
  lib.set('Core.*', (left: any, right: any) => left * right);
  lib.set('Core./', (left: any, right: any) => left / right);

  lib.set('Core.==', (left: any, right: any) => left === right);
  lib.set('Core.!=', (left: any, right: any) => left !== right);
  lib.set('Core.<', (left: any, right: any) => left < right);
  lib.set('Core.<=', (left: any, right: any) => left <= right);
  lib.set('Core.>', (left: any, right: any) => left > right);
  lib.set('Core.>=', (left: any, right: any) => left >= right);

  lib.set('List.length', (arr: any[]) => arr.length);
  lib.set('List.add', (arr: any[], next: any) => [...arr, next]);
  lib.set('List.build', (...arr: any[]) => arr);

  lib.set('println', (...args: any[]) => console.log(...args));

  return lib;
}


