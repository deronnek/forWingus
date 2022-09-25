import { test, expect, chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

type course = {
  name: string;
  section: string;
  room: string;
  lunch: string;
};

async function addClass(page, courseName, section, room) {
  await page.pause();

  // Click text=Options
  await page.locator('text=Options').click();
  // Click text=Add
  await page.locator('text=Add').click();
  await expect(page).toHaveURL(
    'https://aspen.cps.edu/aspen/addRecord.do?maximized=false'
  );
  // Fill input[name="\#propertyValue\(mstCskOID\)"] aka course number
  await page
    .locator('input[name="\\#propertyValue\\(mstCskOID\\)"]')
    .type('095101N');

  await page.waitForTimeout(1000); // hard wait for 1000ms

  // Fill section number:
  await page
    .locator('input[name="propertyValue\\(mstSectionNum\\)"]')
    .type(section);

  // Fill course name
  await page
    .locator('input[name="propertyValue\\(mstFieldC001\\)"]')
    .type(courseName);

  await page
    .locator('input[name="\\#propertyValue\\(mstRmsOID\\)"]')
    .type(room);

  // Always semester 1
  await page
    .locator('input[name="\\#propertyValue\\(mstTrmOID\\)"]')
    .type('S1');

  // Click #bottomButtonBar button:has-text("Save")
  // await page.locator('#bottomButtonBar button:has-text("Save")').click();
  // await expect(page).toHaveURL(
  //   'https://aspen.cps.edu/aspen/masterScheduleDetail.do'
  // );

  await page.pause();
}

// Read the data from disk and parse it
function readData(): course[] {
  // Set the path to the file in a way typescript can understand
  const csvFilePath = path.resolve(__dirname, './selcols.csv');

  // Read the file
  const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });

  // Specify the names of the columns here
  const headers = ['name', 'section', 'room', 'lunch'];

  // After parsing, call useData on the result, which contains the whole array
  return parse(fileContent, {
    delimiter: ',',
    columns: headers,
  });
}

test('test', async ({ page }) => {
  const browser = await chromium.launch({ headless: false });

  function readCreds() {
    const csvFilePath = path.resolve(__dirname, './creds.txt');
    const x = fs.readFileSync(csvFilePath, { encoding: 'utf-8' }).split('\n');
    return { user: x[0], pass: x[1] };
  }
  // Read username and password (first and second lines of creds.txt file)
  const creds = readCreds();
  const classes = readData();

  // Go to https://aspen.cps.edu/aspen/logon.do
  await page.goto('https://aspen.cps.edu/aspen/logon.do');
  // Click input[name="username"]
  await page.locator('input[name="username"]').click();
  // Fill input[name="username"]
  await page.locator('input[name="username"]').fill(creds['user']);
  // Press Tab
  await page.locator('input[name="username"]').press('Tab');
  // Fill input[name="password"]
  await page.locator('input[name="password"]').fill(creds['pass']);
  // Press Enter
  await page.locator('input[name="password"]').press('Enter');
  await expect(page).toHaveURL('https://aspen.cps.edu/aspen/home.do');

  await page.waitForTimeout(1000); // hard wait for 1000ms
  // Click text=Schedule
  await page.locator('text=Schedule').click();
  await expect(page).toHaveURL(
    'https://aspen.cps.edu/aspen/masterContextList.do?navkey=schedule.mst.list'
  );
  for (let i = 1; i < classes.length; i++) {
    await addClass(
      page,
      classes[i]['name'],
      classes[i]['section'],
      classes[i]['room']
    );
  }
});

//const locator = page.locator('input[type=number]');
//await expect(locator).toHaveValue(/[0-9]/);
