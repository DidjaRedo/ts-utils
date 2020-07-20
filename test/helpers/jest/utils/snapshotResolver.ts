import path from 'path';

export function resolveSnapshotPath(testPath: string, snapshotExtension: string, snapshotFolderName: string): string {
    const snapshotPath = path.join(
        path.join(path.dirname(testPath), '__snapshots__', snapshotFolderName),
        path.basename(testPath) + snapshotExtension,
    );
    return snapshotPath;
}

export function resolveTestPath(snapshotFilePath: string, snapshotExtension: string): string {
    const testPath = path.join(
        path.dirname(path.dirname(path.dirname(snapshotFilePath))),
        path.basename(snapshotFilePath, snapshotExtension),
    );
    return testPath;
}

export const testPathForConsistencyCheck = path.posix.join(
    'consistency_check',
    '__tests__',
    'subdir',
    'example.test.js',
);
