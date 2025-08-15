/* eslint-disable @typescript-eslint/no-unsafe-call */
import { PrismaClient } from '@prisma/client';
import puppeteer, { Browser, Page } from 'puppeteer';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';

interface PlayerProjection {
  name: string;
  team: string;
  position: string;
  passProjections: {
    attempts: number;
    completions: number;
    yards: number;
    tds: number;
    ints: number;
  };
  rushProjections: {
    carries: number;
    yards: number;
    tds: number;
    fumbles: number;
  };
  receProjections: {
    receptions: number;
    yards: number;
    tds: number;
  };
  points?: number;
}

interface CreateDataList {
  players: {
    name: string;
    team: string;
    positionId: number;
  }[];
  passProjections: {
    name: string;
    team: string;
    attempts: number;
    completions: number;
    yards: number;
    tds: number;
    ints: number;
  }[];
  rushProjections: {
    name: string;
    team: string;
    carries: number;
    yards: number;
    tds: number;
    fumbles: number;
  }[];
  receProjections: {
    name: string;
    team: string;
    receptions: number;
    yards: number;
    tds: number;
  }[];
  projPoints: {
    name: string;
    team: string;
    points: number;
  }[];
}

interface ProjectionCSVData {
  name: string;
  position: string;
  team: string;
  byeWeek: string;
  price: string;
}

const td = 6;
const ppr = 1;
const passYards = 20;
const rushRecYards = 10;
const turnover = -2;

const prisma = new PrismaClient();

const tableNames = [
  'DraftRecord',
  'Value',
  'PassingProjection',
  'ProjectedPoints',
  'RecievingProjection',
  'RushingProjection',
  'Team',
  'Player',
  'ByeWeek',
  'Position',
];

const baseUrl: string = process.env.BASE_URL!;

let browser: Browser;

const pages: Map<string, Page> = new Map();

async function startPuppeteer() {
  console.log('Starting Puppeteer!');
  browser = await puppeteer.launch();
  const qbPage = await browser.newPage();
  await qbPage.goto(baseUrl + 'qb.php?week=draft');
  pages.set('QB', qbPage);
  const rbPage = await browser.newPage();
  await rbPage.goto(baseUrl + 'rb.php?week=draft');
  pages.set('RB', rbPage);
  const wrPage = await browser.newPage();
  await wrPage.goto(baseUrl + 'wr.php?week=draft');
  pages.set('WR', wrPage);
  const tePage = await browser.newPage();
  await tePage.goto(baseUrl + 'te.php?week=draft');
  pages.set('TE', tePage);
  const kPage = await browser.newPage();
  await kPage.goto(baseUrl + 'k.php?week=draft');
  pages.set('K', kPage);
  const dstPage = await browser.newPage();
  await dstPage.goto(baseUrl + 'dst.php?week=draft');
  pages.set('DST', dstPage);
}

async function stopPuppeteer() {
  console.log('Closing Puppeteer!');
  await browser.close();
}

async function scrapeData() {
  // QB
  const qbData = await getTableData(pages.get('QB')!, convertQBRows);
  console.log('QB data:', qbData);
  const qb = await prisma.position.findFirst({ where: { code: 'QB' } });
  await createPlayersForPosition(qbData, qb!.id);

  // WR
  const wrData = await getTableData(pages.get('WR')!, convertWRRows);
  const wr = await prisma.position.findFirst({ where: { code: 'WR' } });
  await createPlayersForPosition(wrData, wr!.id);

  // RB
  const rbData = await getTableData(pages.get('RB')!, convertRBRows);
  const rb = await prisma.position.findFirst({ where: { code: 'RB' } });
  await createPlayersForPosition(rbData, rb!.id);

  // TE
  const teData = await getTableData(pages.get('TE')!, convertTERows);
  const te = await prisma.position.findFirst({ where: { code: 'TE' } });
  await createPlayersForPosition(teData, te!.id);

  // DST
  const dstData = await getTableData(pages.get('DST')!, convertDSTRows);
  const dst = await prisma.position.findFirst({ where: { code: 'DST' } });
  await createPlayersForPosition(dstData, dst!.id);

  // K
  const kData = await getTableData(pages.get('K')!, convertKRows);
  const k = await prisma.position.findFirst({ where: { code: 'K' } });
  await createPlayersForPosition(kData, k!.id);
}

function convertQBRows(rows: Element[]): PlayerProjection[] {
  return rows.map((row) => {
    const tds = row.querySelectorAll('td');
    return {
      name: tds[0].querySelector('a')?.textContent || '',
      team: tds[0].innerText.split(' ').pop() || '',
      position: 'QB',
      passProjections: {
        attempts: +tds[1].innerText,
        completions: +tds[2].innerText,
        yards: +tds[3].innerText.replace(',', ''),
        tds: +tds[4].innerText,
        ints: +tds[5].innerText,
      },
      rushProjections: {
        carries: +tds[6].innerText,
        yards: +tds[7].innerText.replace(',', ''),
        tds: +tds[8].innerText,
        fumbles: +tds[9].innerText,
      },
      receProjections: {
        receptions: 0,
        yards: 0,
        tds: 0,
      },
    };
  });
}

function convertRBRows(rows: Element[]): PlayerProjection[] {
  return rows.map((row) => {
    const tds = row.querySelectorAll('td');
    return {
      name: tds[0].querySelector('a')?.textContent || '',
      team: tds[0].innerText.split(' ').pop() || '',
      position: 'RB',
      passProjections: {
        attempts: 0,
        completions: 0,
        yards: 0,
        tds: 0,
        ints: 0,
      },
      rushProjections: {
        carries: +tds[1].innerText,
        yards: +tds[2].innerText.replace(',', ''),
        tds: +tds[3].innerText,
        fumbles: +tds[7].innerText,
      },
      receProjections: {
        receptions: +tds[4].innerText,
        yards: +tds[5].innerText.replace(',', ''),
        tds: +tds[6].innerText,
      },
    };
  });
}

function convertWRRows(rows: Element[]): PlayerProjection[] {
  return rows.map((row) => {
    const tds = row.querySelectorAll('td');
    return {
      name: tds[0].querySelector('a')?.textContent || '',
      team: tds[0].innerText.split(' ').pop() || '',
      position: 'WR',
      passProjections: {
        attempts: 0,
        completions: 0,
        yards: 0,
        tds: 0,
        ints: 0,
      },
      rushProjections: {
        carries: +tds[4].innerText,
        yards: +tds[5].innerText.replace(',', ''),
        tds: +tds[6].innerText,
        fumbles: +tds[7].innerText,
      },
      receProjections: {
        receptions: +tds[1].innerText,
        yards: +tds[2].innerText.replace(',', ''),
        tds: +tds[3].innerText,
      },
    };
  });
}

function convertTERows(rows: Element[]): PlayerProjection[] {
  return rows.map((row) => {
    const tds = row.querySelectorAll('td');
    if (tds[0].querySelector('a')?.innerText == 'Robbie Ouzts') {
      return {
        name: 'Ignore This',
        team: 'SEA',
        position: 'TE',
        passProjections: {
          attempts: 0,
          completions: 0,
          yards: 0,
          tds: 0,
          ints: 0,
        },
        rushProjections: {
          carries: 0,
          yards: 0,
          tds: 0,
          fumbles: +tds[4].innerText,
        },
        receProjections: {
          receptions: 0,
          yards: 0,
          tds: 0,
        },
      };
    }
    return {
      name: tds[0].querySelector('a')?.textContent || '',
      team: tds[0].innerText.split(' ').pop() || '',
      position: 'TE',
      passProjections: {
        attempts: 0,
        completions: 0,
        yards: 0,
        tds: 0,
        ints: 0,
      },
      rushProjections: {
        carries: 0,
        yards: 0,
        tds: 0,
        fumbles: +tds[4].innerText,
      },
      receProjections: {
        receptions: +tds[1].innerText,
        yards: +tds[2].innerText.replace(',', ''),
        tds: +tds[3].innerText,
      },
    };
  });
}

function convertKRows(rows: Element[]): PlayerProjection[] {
  return rows.map((row) => {
    const tds = row.querySelectorAll('td');
    return {
      name: tds[0].querySelector('a')?.textContent || '',
      team: tds[0].innerText.split(' ').pop() || '',
      position: 'K',
      passProjections: {
        attempts: 0,
        completions: 0,
        yards: 0,
        tds: 0,
        ints: 0,
      },
      rushProjections: {
        carries: 0,
        yards: 0,
        tds: 0,
        fumbles: 0,
      },
      receProjections: {
        receptions: 0,
        yards: 0,
        tds: 0,
      },
      points: +tds[4].innerText,
    };
  });
}

function convertDSTRows(rows: Element[]): PlayerProjection[] {
  return rows.map((row) => {
    const tds = row.querySelectorAll('td');
    const name = tds[0].querySelector('a')?.textContent;
    let team = '';
    switch (name) {
      case 'Dallas Cowboys':
        team = 'DAL';
        break;
      case 'Baltimore Ravens':
        team = 'BAL';
        break;
      case 'New York Jets':
        team = 'NYJ';
        break;
      case 'Philadelphia Eagles':
        team = 'PHI';
        break;
      case 'Houston Texans':
        team = 'HOU';
        break;
      case 'Cleveland Browns':
        team = 'CLE';
        break;
      case 'Indianapolis Colts':
        team = 'IND';
        break;
      case 'Kansas City Chiefs':
        team = 'KC';
        break;
      case 'San Francisco 49ers':
        team = 'SF';
        break;
      case 'Pittsburgh Steelers':
        team = 'PIT';
        break;
      case 'Buffalo Bills':
        team = 'BUF';
        break;
      case 'Miami Dolphins':
        team = 'MIA';
        break;
      case 'Cincinnati Bengals':
        team = 'CIN';
        break;
      case 'Los Angeles Chargers':
        team = 'LAC';
        break;
      case 'Washington Commanders':
        team = 'WAS';
        break;
      case 'Green Bay Packers':
        team = 'GB';
        break;
      case 'Jacksonville Jaguars':
        team = 'JAC';
        break;
      case 'Seattle Seahawks':
        team = 'SEA';
        break;
      case 'New York Giants':
        team = 'NYG';
        break;
      case 'New Orleans Saints':
        team = 'NO';
        break;
      case 'Tampa Bay Buccaneers':
        team = 'TB';
        break;
      case 'Las Vegas Raiders':
        team = 'LV';
        break;
      case 'Minnesota Vikings':
        team = 'MIN';
        break;
      case 'Denver Broncos':
        team = 'DEN';
        break;
      case 'Detroit Lions':
        team = 'DET';
        break;
      case 'New England Patriots':
        team = 'NE';
        break;
      case 'Chicago Bears':
        team = 'CHI';
        break;
      case 'Atlanta Falcons':
        team = 'ATL';
        break;
      case 'Los Angeles Rams':
        team = 'LAR';
        break;
      case 'Tennessee Titans':
        team = 'TEN';
        break;
      case 'Arizona Cardinals':
        team = 'ARI';
        break;
      case 'Carolina Panthers':
        team = 'CAR';
        break;
      default:
        throw new Error(`Bad defense name: ${name}`);
    }
    return {
      name,
      team,
      position: 'DST',
      passProjections: {
        attempts: 0,
        completions: 0,
        yards: 0,
        tds: 0,
        ints: 0,
      },
      rushProjections: {
        carries: 0,
        yards: 0,
        tds: 0,
        fumbles: 0,
      },
      receProjections: {
        receptions: 0,
        yards: 0,
        tds: 0,
      },
      points: +tds[9].innerText,
    };
  });
}

async function getTableData(
  page: Page,
  converter: (row: Element[]) => PlayerProjection[],
) {
  return await page.$$eval('table[id="data"] tbody tr', converter);
}

async function createPlayersForPosition(
  players: PlayerProjection[],
  positionId: number,
) {
  const data = players.reduce<CreateDataList>(
    (data, player) => {
      data.players.push({ name: player.name, team: player.team, positionId });
      data.passProjections.push({
        name: player.name,
        team: player.team,
        ...player.passProjections,
      });
      data.rushProjections.push({
        name: player.name,
        team: player.team,
        ...player.rushProjections,
      });
      data.receProjections.push({
        name: player.name,
        team: player.team,
        ...player.receProjections,
      });
      data.projPoints.push({
        name: player.name,
        team: player.team,
        points: player.points
          ? player.points
          : Math.round(
              player.passProjections.yards / passYards +
                player.passProjections.tds * td +
                player.passProjections.ints * turnover +
                player.rushProjections.yards / rushRecYards +
                player.rushProjections.tds * td +
                player.rushProjections.fumbles * turnover +
                player.receProjections.yards / rushRecYards +
                player.receProjections.receptions * ppr,
            ),
      });
      return data;
    },
    {
      players: [],
      passProjections: [],
      rushProjections: [],
      receProjections: [],
      projPoints: [],
    },
  );
  console.log('Created: ', data.players);
  await prisma.player.createMany({ data: data.players });
  await prisma.passingProjection.createMany({ data: data.passProjections });
  await prisma.rushingProjection.createMany({ data: data.rushProjections });
  await prisma.recievingProjection.createMany({ data: data.receProjections });
  await prisma.projectedPoints.createMany({ data: data.projPoints });
}

async function updatePlayerValues(data: ProjectionCSVData[]) {
  const values = await Promise.all(
    data.map(async ({ name, team, price }) => {
      const player = await prisma.player.findUnique({
        where: { name_team: { name: name.trim(), team: team.trim() } },
      });
      if (!player) {
        throw new Error(`Player not found ${name} - ${team}`);
      }
      return { playerId: player.id, value: +price };
    }),
  );
  await prisma.value.createMany({ data: values });
}

function parseCSVData(): Promise<ProjectionCSVData[]> {
  const promise: Promise<ProjectionCSVData[]> = new Promise(
    (resolve, reject) => {
      const filePath = 'prisma/cheatsheet.csv';
      const records: ProjectionCSVData[] = [];
      const parser = createReadStream(filePath).pipe(
        parse({ columns: true, delimiter: ',' }),
      );
      parser.on('data', (record) => {
        console.log('data:', record);
        records.push(record);
      });
      parser.on('end', () => {
        console.log('Finished parsing csv');
        resolve(records);
      });
      parser.on('error', (err) => {
        console.error('Error:', err);
        reject(new Error(err.message));
      });
    },
  );
  return promise;
}

async function main() {
  for (const tableName of tableNames) {
    console.log('Deleting: ', tableName);
    await prisma.$queryRawUnsafe(`DELETE FROM ${tableName};`);
    await prisma.$queryRawUnsafe(
      `DELETE FROM sqlite_sequence WHERE name = '${tableName}'`,
    );
  }

  // Positions
  await prisma.position.createMany({
    data: [
      { code: 'QB', name: 'Quarterback' },
      { code: 'RB', name: 'Running Back' },
      { code: 'WR', name: 'Wide Reciver' },
      { code: 'TE', name: 'Tight End' },
      { code: 'K', name: 'Kicker' },
      { code: 'DST', name: 'Team Defense' },
    ],
  });

  // Teams
  await prisma.team.createMany({
    data: [
      { name: 'Kiss My A$$', owner: 'Chris Hill' },
      { name: 'Field of Dreams', owner: 'Blaine Wilson' },
      { name: 'Harrison Butker', owner: 'Tim Sykes' },
      { name: 'Ball So Hard University', owner: 'Mike Sykes' },
      { name: 'Week 1 And Done', owner: 'Bryan Tolle' },
      { name: 'The League is Named After Me', owner: 'Joe Hill' },
      { name: 'F You CMC', owner: 'Matt Moore' },
      { name: 'Hawk Tua', owner: 'Jerry Autry' },
      { name: 'Common Diggs', owner: 'John Frazier' },
      { name: 'Onward Christian Soldiers', owner: 'Chris Mohler' },
      { name: 'Bottom of The Barrel', owner: 'Rich Wilson' },
      { name: 'The Kummanders', owner: 'Rick George' },
      { name: 'Hungry Dogs', owner: 'Michael Polt' },
      { name: 'Main Vein', owner: 'John Main' },
    ],
  });

  // Bye Weeks
  await prisma.byeWeek.createMany({
    data: [
      { team: 'PIT', week: 5 },
      { team: 'CHI', week: 5 },
      { team: 'GB', week: 5 },
      { team: 'ATL', week: 5 },
      { team: 'HOU', week: 6 },
      { team: 'MIN', week: 6 },
      { team: 'BAL', week: 7 },
      { team: 'BUF', week: 7 },
      { team: 'JAC', week: 8 },
      { team: 'LV', week: 8 },
      { team: 'DET', week: 8 },
      { team: 'ARI', week: 8 },
      { team: 'LAR', week: 8 },
      { team: 'SEA', week: 8 },
      { team: 'CLE', week: 9 },
      { team: 'NYJ', week: 9 },
      { team: 'PHI', week: 9 },
      { team: 'TB', week: 9 },
      { team: 'TEN', week: 10 },
      { team: 'CIN', week: 10 },
      { team: 'KC', week: 10 },
      { team: 'DAL', week: 10 },
      { team: 'NO', week: 11 },
      { team: 'IND', week: 11 },
      { team: 'MIA', week: 12 },
      { team: 'DEN', week: 12 },
      { team: 'LAC', week: 12 },
      { team: 'WAS', week: 12 },
      { team: 'NE', week: 14 },
      { team: 'NYG', week: 14 },
      { team: 'CAR', week: 14 },
      { team: 'SF', week: 14 },
    ],
  });

  // Scraping
  await startPuppeteer();
  await scrapeData();
  await stopPuppeteer();

  // CSV
  const csvData = await parseCSVData();
  await updatePlayerValues(csvData);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
