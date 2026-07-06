import { resolveDbRuntime, resolveDbRuntimeFromEnv } from '../config/runtimeDb';

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

  test('resolves in-memory runtime from explicit local environment flag', () => {
    expect(
      resolveDbRuntimeFromEnv({
        NODE_ENV: 'development',
        MONGO_URI: undefined,
        ALLOW_IN_MEMORY_DB: 'true',
      }),
    ).toEqual({ kind: 'memory' });
  });

  test('does not treat non-true ALLOW_IN_MEMORY_DB values as enabled', () => {
    expect(() =>
      resolveDbRuntimeFromEnv({
        NODE_ENV: 'development',
        MONGO_URI: undefined,
        ALLOW_IN_MEMORY_DB: 'false',
      }),
    ).toThrow('MONGO_URI is required. Set ALLOW_IN_MEMORY_DB=true for local development only.');
  });
});
