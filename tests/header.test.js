const Page = require('./helpers/page');

let page;

beforeEach(async () => { 
    page = await Page.build();
    await page.goto('http://localhost:3000');
});

afterEach(async () => {
    await page.close();
});

test('The header has the correct test', async () => {
    const text = await page.getContentsOf('a.brand-logo');
    expect(text).toEqual('Blogster')
});

test('clicking login starts oath flow', async () => {
    await page.click('.right a');
    const url = await page.url();
    expect(url).toMatch('/accounts\.google\.com/')
});

test.only('When signed in, shows logout btn', async () => {
    await page.login();
    const text = await page.getContentsOf('a[href="/auth/logout"]');
    expect(text).toEqual('Logout');
});
