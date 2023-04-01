import path from 'node:path';
import { readFile, mkdir, rm } from 'node:fs/promises';
import { basedir } from '../basedir';

export const downloadDir = path.resolve(
  path.join(basedir, '..', 'build', 'downloads'),
);
await rm(downloadDir, { recursive: true, force: true });
await mkdir(downloadDir, { recursive: true });

export async function waitForFile(
  name: string,
  timeout: number,
): Promise<string> {
  const fileName = path.join(downloadDir, name);
  const exp = Date.now() + timeout;

  do {
    try {
      return await readFile(fileName, { encoding: 'utf-8' });
    } catch (e) {
      await new Promise((res): void => {
        setTimeout(res, 100);
      });
    }
  } while (Date.now() < exp);

  throw new Error(`Failed to download file ${name} within ${timeout}ms`);
}
