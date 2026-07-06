type ResolveDbRuntimeInput = {
  nodeEnv: string | undefined;
  mongoUri: string | undefined;
  allowInMemoryDb: boolean;
};

export type DbRuntime =
  | { kind: 'mongo'; uri: string }
  | { kind: 'memory' };

type DbRuntimeEnv = {
  NODE_ENV?: string;
  MONGO_URI?: string;
  ALLOW_IN_MEMORY_DB?: string;
};

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

export const resolveDbRuntimeFromEnv = (env: DbRuntimeEnv): DbRuntime =>
  resolveDbRuntime({
    nodeEnv: env.NODE_ENV,
    mongoUri: env.MONGO_URI,
    allowInMemoryDb: env.ALLOW_IN_MEMORY_DB === 'true',
  });
