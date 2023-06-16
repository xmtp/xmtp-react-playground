declare module "web3.storage" {
  declare class Web3Storage {
    constructor(opts: { token: string });
    put(files: [Filelike]);
  }
  export interface Filelike {
    name: string;
    data: Uint8Array;
    stream(): ReadableArray;
  }
}
