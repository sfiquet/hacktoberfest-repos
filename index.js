const fsPromises = require('fs').promises;
const util = require('util');

const axios = require('axios');
const parse = require('parse-link-header');

const MAX_RESULTS = 1000; // maximum number of results returned by the API, even with pagination
const TIMEOUT = 6 * 1000; // 10 requests per minute allowed

const ISSUES_FILE = 'issues.json';

const timeout = util.promisify(setTimeout);

async function requestGitHubData(query){
  try {
    return await Promise.all([
        axios(query).,
        timeout(TIMEOUT),
    ]);
  } catch(err) {
    console.log(err);
    throw err;
  }
}

// requests all the pages for one query and builds the aggregated result
async function getPaginatedResults(){}

// makes as many requests as necessary to get all the data
async function getAllResults(){}

// temporary
async function saveIssues(issues){
  try{
    await fsPromises.writeFile(ISSUES_FILE, JSON.stringify(issues, null, 2));
  } catch(err) {
    console.error(`Error while saving data: ${err}`);
    throw err;
  }

}

function buildIssueQuery(extraQualifiers){
  const url = 'https://api.github.com/search/issues';
  const qualifiers = [
    'label:hacktoberfest',
    'type:issue',
    'state:open',
    'archived:false',
  ];
  let query = qualifiers.concat(extraQualifiers).join('+');
  console.log(query);
  return `${url}?q=${query}&per_page=100`;
}

async function getIssuesFrom(startDate){
  results = [];
  try{
    const response = await axios.get(buildIssueQuery([`updated:>=${startDate}`]));
    //console.log(typeof response.data);
    //console.log(`Items: ${response.data.items.length}`);
    //console.log(response.status);
    //console.log(response.statusText);
    //console.log(response.headers);
    //console.log(response.config);

    if (response.data.incomplete_results){
      console.log('WARNING: Query was timed out. Results might be incomplete.');
    }
    
    const maxItems = response.data.total_count;
    console.log(`maxItems: ${maxItems}`);

    results = results.concat(response.data.items.map(item => item.repository_url));
    
    // pagination
    let parsed = parse(response.headers.link);
    console.log(`Pages: ${parsed.last.page}`);

    while (parsed.next){
      let res = await axios.get(parsed.next.url);

      if (res.data.incomplete_results){
        console.log('WARNING: Query was timed out. Results might be incomplete.');
      }
      results = results.concat(res.data.items.map(item => item.repository_url));
      parsed = parse(res.headers.link);
    }


    return results;

  } catch(err){
    console.log(err);
    throw err;
  }
}

function extractUniqueRepos(issues){
  console.log('extractUniqueRepos not implemented yet');
  return [];
}

async function storeRepoData(repos){
  console.log('storeRepoData not implemented yet');
}

async function buildData(){
  const now = Date.now();
  const year = now.getUTCFullYear();
  //const month = now.getUTCMonth() + 1;
  //const date = now.getUTCDate();

  try {
    // simplify for testing
//    let issues = await getIssuesFrom(`${year-1}-11-15`);
    let issues = await getIssuesFrom(`${year}-09-23`);
    await saveIssues(issues);
    let repos = await extractUniqueRepos(issues);
    await storeRepoData(repos);

  } catch(err){
    console.log(err);
    throw err;
  }
}

// only run the module if run directly
if (require.main === module) {
  buildData();
}
