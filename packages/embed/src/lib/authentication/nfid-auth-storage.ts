import { IdbKeyVal } from '@dfinity/auth-client';
import { AuthClientStorage } from '@dfinity/auth-client/lib/cjs/storage';

const DB_VERSION = 1;
const DB_NAME = 'nfid';
const STORE_NAME = 'credential';

export class NFIDAuthStorage implements AuthClientStorage {
  // Initializes a KeyVal on first request
  private initializedDb: IdbKeyVal | undefined;
  get _db(): Promise<IdbKeyVal> {
    return new Promise((resolve) => {
      if (this.initializedDb) {
        resolve(this.initializedDb);
        return;
      }
      IdbKeyVal.create({
        dbName: DB_NAME,
        storeName: STORE_NAME,
        version: DB_VERSION,
      }).then((db) => {
        this.initializedDb = db;
        resolve(db);
      });
    });
  }

  public async get(key: string): Promise<string | null> {
    const db = await this._db;
    return await db.get<string>(key);
    // return (await db.get<string>(key)) ?? null;
  }

  public async set(key: string, value: string): Promise<void> {
    const db = await this._db;
    await db.set(key, value);
  }

  public async remove(key: string): Promise<void> {
    const db = await this._db;
    await db.remove(key);
  }
}
