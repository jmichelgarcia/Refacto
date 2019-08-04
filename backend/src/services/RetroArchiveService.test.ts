import { MemoryDb } from 'collection-storage';
import RetroArchiveService from './RetroArchiveService';

describe('RetroArchiveService', () => {
  let service: RetroArchiveService;
  let a1: string;

  beforeEach(async () => {
    const db = new MemoryDb();
    service = new RetroArchiveService(db);
    a1 = await service.createArchive('my-retro-id', { format: 'foo', items: [] });
    await service.createArchive('my-retro-id', { format: 'bar', items: [] });
  });

  describe('getRetroArchive', () => {
    it('returns the requested retro archive by ID', async () => {
      const archive = await service.getRetroArchive('my-retro-id', a1);

      expect(archive).not.toBeNull();
      expect(archive!.format).toEqual('foo');
    });

    it('returns null if the archive is not in the retro', async () => {
      const archive = await service.getRetroArchive('nope', a1);

      expect(archive).toBeNull();
    });

    it('returns null if the archive ID does not exist', async () => {
      const archive = await service.getRetroArchive('my-retro-id', 'nope');

      expect(archive).toBeNull();
    });
  });
});
