/* eslint-disable no-console */
import _ from 'lodash';
// import {glob} from 'glob';
import {system, fs, node} from '@appium/support';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CD_EXECUTABLE_PREFIX = 'chromedriver';
const MODULE_NAME = '@rpai/appium-chromium-driver';
const __filename = fileURLToPath(import.meta.url);

/**
 * Calculates the path to the current module's root folder
 *
 * @returns {string} The full path to module root
 * @throws {Error} If the current module root folder cannot be determined
 */
const getModuleRoot = _.memoize(function getModuleRoot() {
  const root = node.getModuleRootSync(MODULE_NAME, __filename);
  if (!root) {
    throw new Error(`Cannot find the root folder of the ${MODULE_NAME} Node.js module`);
  }
  return root;
});
const CD_BASE_DIR = path.join(getModuleRoot(), 'chromedriver');

async function getPath() {
  const pacthVersion = '28.0.6613';
  const pathSuffix = system.isWindows ? '.exe' : '';
  const str = `**/mac/${CD_EXECUTABLE_PREFIX}*${pacthVersion}*${pathSuffix}`;
  console.log(CD_BASE_DIR, str);
  const paths = await fs.glob(str, {
    cwd: CD_BASE_DIR,
    absolute: true,
    nocase: true,
    nodir: true,
  });
  console.log(paths);
  return paths;
}

getPath();