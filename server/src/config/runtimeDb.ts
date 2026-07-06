type ResolveDbRuntimeInput = {
  nodeEnv: string | undefined;
  mongoUri: string | undefined;
  allowInMemoryDb: boolean;
};

export type DbRuntime =
  | { kind: 'mongo'; uri: string }
  | { kind: 'memory' };

export const resolveDbRuntime = ({
  nodeEnv,
  mongoUri,
  allowInMemoryDb,
}: ResolveDbRuntimeInput): DbRuntime => {
  if (mongoUri) {
    return { kind: 'mongo', uri: mongoUri };
  }

  if (nodeEnv === 'production') {
    throw new Error('MONGO_URI is required in production');
  }

  if (allowInMemoryDb) {
    return { kind: 'memory' };
  }

  throw new Error('MONGO_URI is required. Set ALLOW_IN_MEMORY_DB=true for local development only.');
};
