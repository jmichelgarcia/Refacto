import { v4 as uuidv4 } from 'uuid';
import { type Collection, type DB } from 'collection-storage';
import { encryptByRecordWithMasterKey } from '../import-wrappers/collection-storage-wrap';
import {
  type RetroArchive,
  type RetroData,
  type RetroArchiveSummary,
} from '../shared/api-entities';

export class RetroArchiveService {
  private readonly archiveCollection: Collection<RetroArchive>;

  public constructor(db: DB, encryptionKey: Buffer) {
    const enc = encryptByRecordWithMasterKey<string>(
      encryptionKey,
      db.getCollection('archive_key'),
      { keyCache: { capacity: 128 } },
    );

    this.archiveCollection = enc<RetroArchive>()(
      ['items'],
      db.getCollection('archive', { retroId: {} }),
    );
  }

  public async createArchive(
    retroId: string,
    data: RetroData,
    created?: number,
  ): Promise<string> {
    const id = uuidv4();
    const now = Date.now();

    await this.archiveCollection.add({
      id,
      retroId,
      created: created || now,
      imported: created ? now : null,
      format: data.format,
      options: data.options,
      items: data.items,
    });

    return id;
  }

  public getRetroArchiveSummaries(
    retroId: string,
  ): Promise<Readonly<RetroArchiveSummary>[]> {
    return this.archiveCollection.getAll('retroId', retroId, ['id', 'created']);
  }

  public async getRetroArchive(
    retroId: string,
    archiveId: string,
  ): Promise<Readonly<RetroArchive> | null> {
    const archiveData = await this.archiveCollection.get('id', archiveId);
    if (!archiveData || archiveData.retroId !== retroId) {
      return null;
    }
    return archiveData;
  }

  public getRetroArchiveList(
    retroId: string,
  ): Promise<Readonly<RetroArchive[]>> {
    return this.archiveCollection.getAll('retroId', retroId);
  }
}
