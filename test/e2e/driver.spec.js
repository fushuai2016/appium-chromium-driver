import {main as startAppium} from 'appium';
import { waitForCondition } from 'asyncbox';
import path from 'path';
import os from 'os';
import {remote} from 'webdriverio';

const osPlatform = os.platform();
const isMac = /darwin/i.test(osPlatform);
const isWin = /win32/i.test(osPlatform);
const PLATFORM = isMac ? 'mac' : (isWin ? 'windows' : 'mac');
const PORT = process.env.TEST_PORT || 4780;
const HOST = '127.0.0.1';
const CHROME_BIN = process.env.TEST_CHROME;

const SERVER_URL = `http://${HOST}:${PORT}`;

const DEF_CAPS = {
  platformName: PLATFORM,
  browserName: 'chrome',
  'appium:automationName': 'Chromium',
  'appium:autodownloadEnabled': true,
  'appium:useSystemExecutable': true,
  webSocketUrl: true,
  'appium:executable': path.join(process.cwd(), 'chromedriver/win/chromedriver_win32_v113.0.5672.63.exe'),
 'goog:chromeOptions': {
    binary: path.join(process.cwd(), 'chromedriver/chrome-win64/chrome.exe'),
  }
};

// GitHub Actions
if (process.env.CHROMEWEBDRIVER) {
  DEF_CAPS['appium:executable'] = path.join(
    process.env.CHROMEWEBDRIVER,
    `chromedriver${process.platform === 'win32' ? '.exe' : ''}`
  );
}

if (CHROME_BIN) {
  DEF_CAPS['goog:chromeOptions'] = {
    binary: CHROME_BIN,
  };
}

const WDIO_OPTS = {
  hostname: HOST,
  port: PORT,
  connectionRetryCount: 0,
  capabilities: DEF_CAPS,
};

function setupDriver() {
  /** @type {{driver: import('webdriverio').Browser}} */
  let ctx = {driver: null};

  before(async function() {
    ctx.driver = await remote(WDIO_OPTS);
  });

  after(async function() {
    if (ctx.driver) {
      await ctx.driver.deleteSession();
      ctx.driver = null;
    }
  });

  return ctx;
}


describe('ChromeDriver', function() {
  /** @type import('@appium/types').AppiumServer */
  let appium;
  let chai;

  before(async function() {
    chai = await import('chai');
    const chaiAsPromised = await import('chai-as-promised');

    chai.should();
    chai.use(chaiAsPromised.default);

    appium = await startAppium({port: PORT});
  });

  after(async function() {
    await appium.close();
  });

  describe('basic session handling', function() {
    const ctx = setupDriver();

    it('should navigate to a url', async function() {
      await ctx.driver.navigateTo(`${SERVER_URL}/status`);
    });

    it('should get page soruce', async function() {
      await ctx.driver.getPageSource().should.eventually.match(/value.+build.+version/);
    });
  });

  describe('bidi commands', function() {
    const ctx = setupDriver();

    it('should navigate to a url', async function() {
      const d = ctx.driver;
      const {contexts} = await d.browsingContextGetTree({});
      await d.browsingContextNavigate({
        context: contexts[0].context,
        url: `${SERVER_URL}/test/guinea-pig`,
        wait: 'complete',
      });
      await d.getUrl().should.eventually.include('guinea-pig');
    });

    it('should execute javascript', async function() {
      const d = ctx.driver;
      const {contexts} = await d.browsingContextGetTree({});
      const res = await d.scriptEvaluate({
        expression: 'document.title',
        target: {context: contexts[0].context},
        awaitPromise: false,
      });
      res.result.value.should.eql('I am a page title');
    });

    it('should receive bidi events', async function() {
      const d = ctx.driver;
      const {contexts} = await d.browsingContextGetTree({});
      const networkResponses = [];
      d.on('network.responseCompleted', (response) => networkResponses.push(response));
      await d.sessionSubscribe({events: ['network.responseCompleted'], contexts: [contexts[0].context]});
      networkResponses.should.be.empty;
      await d.navigateTo(`${SERVER_URL}/test/guinea-pig`);
      try {
        await waitForCondition(() => {
            try {
              networkResponses.should.not.be.empty;
              return true;
            } catch (ign) {
              return false;
            }
          },
          {
            waitMs: 5000,
            intervalMs: 100,
          },
        );
      } catch (err) {
        networkResponses.should.not.be.empty;
      }
    });

  });
});
