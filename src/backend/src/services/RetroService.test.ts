import crypto from 'crypto';
import { MemoryDb } from 'collection-storage';
import { Spec } from 'json-immutability-helper';
import {
  TopicMessage,
  TrackingTopicMap,
  InMemoryTopic,
  ChangeInfo,
  Subscription,
} from 'shared-reducer-backend';
import { makeRetroItem, Retro } from 'refacto-entities';
import RetroService from './RetroService';

interface CapturedChange {
  message: ChangeInfo<Retro>;
  meta: any;
}

class ChangeListener {
  public readonly messages: CapturedChange[] = [];

  public readonly onChange: (message: ChangeInfo<Retro>, meta: any) => void;

  public constructor() {
    this.onChange = (message: ChangeInfo<Retro>, meta: any): void => {
      this.messages.push({ message, meta });
    };
  }

  public messageCount(): number {
    return this.messages.length;
  }

  public latestChange(): Spec<Retro> | undefined {
    return this.latestMessage()?.message?.change;
  }

  public latestError(): string | undefined {
    return this.latestMessage()?.message?.error;
  }

  public latestMeta(): any {
    return this.latestMessage()?.meta;
  }

  private latestMessage(): CapturedChange | undefined {
    return this.messages[this.messages.length - 1];
  }
}

describe('RetroService', () => {
  let service: RetroService;
  let r1: string;
  let r2: string;

  beforeEach(async () => {
    const db = new MemoryDb();
    const topic = new TrackingTopicMap<TopicMessage<Retro>>(
      () => new InMemoryTopic(),
    );
    service = new RetroService(db, crypto.randomBytes(32), topic);
    r1 = await service.createRetro(
      'me',
      'my-retro',
      'My Retro',
      'something',
    );
    r2 = await service.createRetro(
      'nobody',
      'my-second-retro',
      'My Second Retro',
      'other',
    );
    await service.retroBroadcaster.update(r2, {
      state: { $set: { someRetroSpecificState: true } },
      items: { $push: [makeRetroItem({ id: 'yes' })] },
    });
  });

  describe('getRetroIdForSlug', () => {
    it('returns a retro ID for the given slug', async () => {
      const id = await service.getRetroIdForSlug('my-second-retro');

      expect(id).toEqual(r2);
    });

    it('returns null if the slug is not found', async () => {
      const id = await service.getRetroIdForSlug('nope');

      expect(id).toEqual(null);
    });
  });

  describe('getRetroListForUser', () => {
    it('returns a list of summarised retros for the user', async () => {
      const retros = await service.getRetroListForUser('me');

      expect(retros.length).toEqual(1);
      expect(retros[0]).toEqual({
        id: r1,
        slug: 'my-retro',
        name: 'My Retro',
      });
    });
  });

  describe('isRetroOwnedByUser', () => {
    it('returns true for retros owned by the user', async () => {
      const owned = await service.isRetroOwnedByUser(r1, 'me');

      expect(owned).toEqual(true);
    });

    it('returns false for retros not owned by the user', async () => {
      const owned = await service.isRetroOwnedByUser(r2, 'me');

      expect(owned).toEqual(false);
    });

    it('returns false for retros which do not exist', async () => {
      const owned = await service.isRetroOwnedByUser('nope', 'me');

      expect(owned).toEqual(false);
    });
  });

  describe('retroBroadcaster', () => {
    let listener: ChangeListener;
    let subscription: Subscription<Retro, void>;

    beforeEach(async () => {
      listener = new ChangeListener();
      const sub = await service.retroBroadcaster.subscribe(
        r2,
        listener.onChange,
        service.getPermissions(true),
      );
      if (!sub) {
        throw new Error('Failed to subscribe to retro');
      }
      subscription = sub;
    });

    afterEach(() => subscription?.close());

    it('connects to the backing retro data', async () => {
      const retro = subscription.getInitialData();

      expect(retro).not.toBeNull();
      expect(retro.name).toEqual('My Second Retro');
    });

    it('returns full details', async () => {
      const retro = subscription.getInitialData();

      expect(retro).not.toBeNull();
      expect(retro.format).toEqual('other');
      expect(retro.items.length).toEqual(1);
      expect(retro.state).toEqual({ someRetroSpecificState: true });
    });

    it('returns null if the ID is not found', async () => {
      const failedSubscription = await service.retroBroadcaster.subscribe(
        'nope',
        listener.onChange,
        service.getPermissions(true),
      );

      expect(failedSubscription).toBeNull();
    });

    it('rejects attempts to change sensitive data', async () => {
      await subscription.send({ ownerId: { $set: 'me' } });
      expect(listener.latestError()).toEqual('Cannot edit field ownerId');

      await subscription.send({ id: { $set: '123' } });
      expect(listener.latestError()).toEqual('Cannot edit field id');
      expect(listener.messageCount()).toEqual(2);
    });

    it('allows changing slug to valid forms', async () => {
      await subscription.send({ slug: { $set: 'wooo' } });
      expect(listener.latestError()).toEqual(undefined);
    });

    it('does not allow conflicting slugs', async () => {
      await subscription.send({ slug: { $set: 'my-retro' } });
      expect(listener.latestError()).toEqual('URL is already taken');
      expect(listener.messageCount()).toEqual(1);
    });

    it('rejects changing slug to invalid values', async () => {
      await subscription.send({ slug: { $set: 'NOPE' } });
      expect(listener.latestError()).toEqual('Invalid URL');
      expect(listener.messageCount()).toEqual(1);
    });

    it('rejects attempts to add new top-level fields', async () => {
      await subscription.send({ newThing: { $set: 'woo' } } as any);
      expect(listener.latestError()).toEqual('Unexpected property newThing');
      expect(listener.messageCount()).toEqual(1);
    });

    it('rejects attempts to delete top-level fields', async () => {
      await subscription.send({ $unset: ['ownerId'] });
      expect(listener.latestError()).toBeTruthy();
      expect(listener.messageCount()).toEqual(1);
    });

    it('rejects attempts to modify retros in invalid ways', async () => {
      await subscription.send({ items: { $push: [{ nope: 7 }] } } as any);
      expect(listener.latestError()).toBeTruthy();
      expect(listener.messageCount()).toEqual(1);
    });

    it('rejects all writes in readonly mode', async () => {
      const readSubscription = await service.retroBroadcaster.subscribe(
        r2,
        listener.onChange,
        service.getPermissions(false),
      );

      await readSubscription!.send({ slug: { $set: 'wooo' } });
      expect(listener.latestError()).toEqual('Cannot modify data');

      await readSubscription!.close();
    });
  });
});
