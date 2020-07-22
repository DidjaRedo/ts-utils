import * as Resolver from '../utils/snapshotResolver';

export const CLI_SNAPSHOT_FOLDER = '__cli__';

export function resolveSnapshotPath(testPath: string, ext: string): string {
    return Resolver.resolveSnapshotPath(testPath, ext, CLI_SNAPSHOT_FOLDER);
}

export function resolveTestPath(snapshotPath: string, ext: string): string {
    return Resolver.resolveTestPath(snapshotPath, ext);
}

export const testPathForConsistencyCheck = Resolver.testPathForConsistencyCheck;
