import { resolveDbRuntime } from '../config/runtimeDb';

describe('resolveDbRuntime', () => {
  test('requires MONGO_URI in production', () => {
    expect(() =>
      resolveDbRuntime({
        nodeEnv: 'production',
        mongoUri: undefined,
        allowInMemoryDb: false,
      }),
    ).toThrow('MONGO_URI is required in production');
  });

  test('allows in-memory DB only when explicitly enabled outside production', () => {
    expect(
      resolveDbRuntime({
        nodeEnv: 'development',
        mongoUri: undefined,
        allowInMemoryDb: true,
      }),
    ).toEqual({ kind: 'memory' });
  });

  test('uses configured MongoDB URI when present', () => {
    expect(
      resolveDbRuntime({
        nodeEnv: 'production',
        mongoUri: 'mongodb://localhost:27017/todo-db',
        allowInMemoryDb: false,
      }),
    ).toEqual({ kind: 'mongo', uri: 'mongodb://localhost:27017/todo-db' });
  });
});
