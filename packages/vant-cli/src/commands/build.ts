import { start, error, success } from 'signale';
import { join } from 'path';
import { clean } from './clean';
import { remove, copy, readdirSync } from 'fs-extra';
import { compileJs } from '../compiler/compile-js';
import { compileSfc } from '../compiler/compile-sfc';
import { compileStyle } from '../compiler/compile-style';
import { compilePackage } from '../compiler/compile-package';
import { genPackageEntry } from '../compiler/gen-package-entry';
import { genStyleDepsMap } from '../compiler/gen-style-deps-map';
import { genComponentStyle } from '../compiler/gen-component-style';
import { SRC_DIR, LIB_DIR, ES_DIR } from '../common/constant';
import {
  isDir,
  isSfc,
  isStyle,
  isScript,
  isDemoDir,
  isTestDir,
  setNodeEnv,
  setModuleEnv
} from '../common';

async function compileDir(dir: string) {
  const files = readdirSync(dir);

  await Promise.all(
    files.map(filename => {
      const filePath = join(dir, filename);

      if (isDemoDir(filePath) || isTestDir(filePath)) {
        return remove(filePath);
      }

      if (isDir(filePath)) {
        return compileDir(filePath);
      }

      if (isSfc(filePath)) {
        return compileSfc(filePath);
      }

      if (isScript(filePath)) {
        return compileJs(filePath);
      }

      if (isStyle(filePath)) {
        return compileStyle(filePath);
      }

      return remove(filePath);
    })
  );
}

export async function buildESModuleOutputs() {
  await copy(SRC_DIR, ES_DIR);

  start('Build esmodule outputs');

  try {
    setModuleEnv('esmodule');
    await compileDir(ES_DIR);
    success('Build esmodule outputs');
  } catch (err) {
    error('Build esmodule outputs');
  }
}

export async function buildCommonjsOutputs() {
  await copy(SRC_DIR, LIB_DIR);

  start('Build commonjs outputs');

  try {
    setModuleEnv('commonjs');
    await compileDir(LIB_DIR);
    success('Build commonjs outputs');
  } catch (err) {
    error('Build commonjs outputs');
  }
}

export async function buildStyleEntry() {
  start('Build style entry');

  try {
    genStyleDepsMap();
    genComponentStyle();
    success('Build style entry');
  } catch (err) {
    error('Build style entry');
  }
}

export async function buildPackedOutputs() {
  start('Build packed outputs');

  try {
    genPackageEntry();
    await compilePackage(false);
    await compilePackage(true);
    success('Build packed outputs');
  } catch (err) {
    error('Build packed outputs');
  }
}

export async function build() {
  setNodeEnv('production');
  await clean();
  await buildESModuleOutputs();
  await buildCommonjsOutputs();
  await buildStyleEntry();
  await buildPackedOutputs();
}
