/*
 * Copyright (c) 2020 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import * as path from 'path';
import fs from 'fs';

export interface MockFileConfig {
    path: string;
    backingFile?: string;
    payload?: string;
    writable?: boolean;
}

export class ReadWriteSpies {
    public readonly read: jest.SpyInstance;
    public readonly write: jest.SpyInstance;

    public constructor(read: jest.SpyInstance, write: jest.SpyInstance) {
        this.read = read;
        this.write = write;
    }

    public clear(): void {
        this.read.mockClear();
        this.write.mockClear();
    }

    public restore(): void {
        this.read.mockRestore();
        this.write.mockRestore();
    }
}

export class MockFileSystem {
    protected readonly _config: Map<string, MockFileConfig>;
    protected readonly _data: Map<string, string>;

    public constructor(configs: Iterable<MockFileConfig>) {
        this._config = new Map<string, MockFileConfig>();
        this._data = new Map<string, string>();

        for (const config of configs) {
            const fullPath = path.resolve(config.path);
            this._config.set(fullPath, config);
            if (config.backingFile) {
                this.readMockFileSync(fullPath);
            }
            else if (config.payload) {
                this._data.set(fullPath, config.payload);
            }
        }
    }

    public readMockFileSync(wanted: string): string {
        const fullPathWanted = path.resolve(wanted);
        if (!this._data.has(fullPathWanted)) {
            const config = this._config.get(fullPathWanted);
            if (config?.backingFile === undefined) {
                throw new Error(`Mock file not found: ${wanted}`);
            }
            const fullBackingPath = path.resolve(config.backingFile);
            const body = fs.readFileSync(fullBackingPath).toString();
            this._data.set(fullPathWanted, body);
        }

        const payload = this._data.get(fullPathWanted);
        // not actually reproducible right now
        // istanbul ignore next
        if (payload === undefined) {
            throw new Error(`Mock file ${wanted} payload is undefined.`);
        }
        return payload;
    }

    public writeMockFileSync(wanted: string, body: string): void {
        const fullPathWanted = path.resolve(wanted);
        const config = this._config.get(fullPathWanted);
        if (config === undefined) {
            throw new Error(`Mock path not found: ${wanted}`);
        }
        if (config.writable !== true) {
            throw new Error(`Mock permission denied: ${wanted}`);
        }
        this._data.set(fullPathWanted, body);
    }

    public reset(): void {
        const writable = Array.from(this._config.values()).filter((c) => c.writable === true);
        for (const config of writable) {
            this._data.delete(path.resolve(config.path));
            if (config.backingFile) {
                this.readMockFileSync(path.resolve(config.path));
            }
            else if (config.payload) {
                this._data.set(path.resolve(config.path), config.payload);
            }
        }
    }

    public startSpies(): ReadWriteSpies {
        return new ReadWriteSpies(
            jest.spyOn(fs, 'readFileSync').mockImplementation((wanted: string|number|Buffer|URL) => {
                if (typeof wanted !== 'string') {
                    throw new Error('readFileSync mock supports only string parameters');
                }
                return this.readMockFileSync(wanted);
            }),
            jest.spyOn(fs, 'writeFileSync').mockImplementation((wanted: string|number|Buffer|URL, payload: unknown) => {
                if ((typeof wanted !== 'string') || (typeof payload !== 'string')) {
                    throw new Error('writeFileSync mock supports only string parameters');
                }
                return this.writeMockFileSync(wanted, payload);
            }),
        );
    }
}
