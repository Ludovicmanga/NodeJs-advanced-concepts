const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');

class CustomPage {    
    static async build() {
        const browser = await puppeteer.launch({
          args: ['--no-sandbox']
        });
        const page = await browser.newPage();
        const customPage = new CustomPage(page);

        return new Proxy(customPage, {
            get: (target, property, receiver) => {
              if (target[property]) {
                return target[property];
              }
      
              let value = browser[property];
              if (value instanceof Function) {
                return function (...args) {
                  return value.apply(this === receiver ? browser : this, args);
                };
              }
      
              value = page[property];
              if (value instanceof Function) {
                return function (...args) {
                  return value.apply(this === receiver ? page : this, args);
                };
              }
      
              return value;
            },
          });
    }

    constructor(page) {
        this.page = page;
    } 

    async login () {
        const user = await userFactory();
        const { session, sig } = sessionFactory(user);
         
        await this.page.setCookie({ name: 'session', value: session });
        await this.page.setCookie({ name: 'session.sig', value: sig });
        await this.page.goto('http://localhost:3000/blogs');
        await this.page.waitForSelector('a[href="/auth/logout"]');
    }

    async getContentsOf(selector) {
        return this.page.$eval(selector, el => el.innerHTML);
    }

    get(path) {
      return this.page.evaluate(async (_path) => {
        const response = await fetch(_path, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
        });
        return response.json();
      }, path);
    }

    post(path, data) {
      return this.page.evaluate(async (_path, _data) => {
        const response = await fetch(_path, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify(_data)
        });
        return response.json();
      }, path, data);
    }

    execRequests(actions) {
      return Promise.all(
        actions.map(({ method, path, data }) => {
        return this[method](path, data);
      }))
    }
}

module.exports = CustomPage;