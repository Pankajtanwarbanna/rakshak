// alert stats
let alert_stats     = [];
let total_pages     = 1;
let total_requests  = 0;
let total_pii       = 0;

// prepare accordion header
function prepareAccordionHeader(alert, index) {
  return `
    <h2 class="accordion-header" id="panelsStayOpen-heading${index}">
      <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-collapse${index}" aria-expanded="true" aria-controls="panelsStayOpen-collapse${index}">
          <span class="badge bg-success">${alert.request.method}</span> &nbsp; ${alert.request.url}
          <span style="margin-left: 200px;"> <span class="badge rounded-pill bg-danger">${alert.alerts.count} Detected</span></span>
      </button>
    </h2>
  `
}

// preparing table
function prepareTable(content, index) {
  return `
    <tbody>
      <tr>
        <th scope="row">${index + 1}.</th>
        <td>${content.path.split(".").join(" => ")}</td>
        <td>${content.val}</td>
        <td><span class="badge rounded-pill bg-danger">${content.alert} </span></td>
      </tr>
    </tbody>
  `
}

// render table
function table(content) {
  let table = '';
  content.forEach((element, index) => {
    table += prepareTable(element, index);
  });
  return table;
}

// Preparing accordion body
function prepareAccordionBody(alert, index) {
  return `
  <div id="panelsStayOpen-collapse${index}" class="accordion-collapse collapse show" aria-labelledby="panelsStayOpen-heading${index}">
    <div class="accordion-body">
        A total of <strong>${alert.alerts.count}</strong> PII information has been detected by Rakshak in the response of this network request.
        <div class="table-responsive">
        <table class="table caption-top">
            <caption>Details</caption>
            <thead class="table-dark">
                <tr>
                <th scope="col">#</th>
                <th scope="col">Path</th>
                <th scope="col">PII Information</th>
                <th scope="col">Alert</th>
                </tr>
            </thead>
            ${table(alert.alerts.content)}
            </table>
        </div>
    </div>
  </div>
  `
}

// preparing accordion
function prepareAccordion(alerts) {
  let accordion         = '<div class="accordion-item">';
  let accordionClosing  = '</div>';
  
  alerts.forEach((alert, index) => {
    accordion += prepareAccordionHeader(alert, index) + prepareAccordionBody(alert, index);
  })

  return accordion + accordionClosing;
}

// Request Not Already Tracked
function notAlreadyTracked(alerts, method, url) {
  for(let alert of alerts) {
    if(alert.request.method === method && alert.request.url === url) return false;
  }
  return true;
}

chrome.devtools.network.onRequestFinished.addListener(async function(request) {
    // logging each request here
    if(request._resourceType === 'xhr') {
        let response    = request.response;

        // check if content type is json
        if(response.content.mimeType === 'application/json' && notAlreadyTracked(alert_stats, request.request.method, request.request.url)) {

          total_requests   += 1;

          request.getContent((body) => {
            parsed_response     = JSON.parse(body);

            let alerts_response = runGuard(parsed_response);

            let prepare_alerts  = runFlatten(alerts_response);

            if(prepare_alerts.length > 0) {
              alert_stats.push({
                request   : {
                  'method'  : request.request.method,
                  'url'     : request.request.url  
                },
                response  : {
                  'status'  : request.response.status
                },
                alerts      : {
                  'count'   : prepare_alerts.length,
                  'content' : prepare_alerts
                }
              });
              total_pii     += prepare_alerts.length;
            }
            document.getElementById('accordionPanelsStayOpenExample').innerHTML = prepareAccordion(alert_stats);  
            document.getElementById('total_sites').innerText                    = total_pages;
            document.getElementById('total_requests').innerText                 = total_requests;
            document.getElementById('total_pii').innerText                      = total_pii;
          });
        }
    } 
});

const mobileRegex   = /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[789]\d{9}$/gm;
const panRegex      = /^[A-Z]{3}[ABCFGHLJPTF]{1}[A-Z]{1}[0-9]{4}[A-Z]{1}/gm;
const emailRegex    = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/gm;
const pinCodeRegex  = /^[0-9]{6}$/gm;

function runFlatten(alerts) {

    let response = [];

    // flatter the payload
    function flatter(alerts) {
        alerts.forEach((val) => {
            if(Array.isArray(val)) {
              flatter(val);
            } else {
                response.push(val);
            }
        })
    }
    flatter(alerts);

    return response;
}

function runGuard(payload, name = '') {
    let res = [];

    Object.entries(payload).forEach((entry) => {
      const [key, val]  = entry;

      if(val && typeof val === 'object') {
        let resp = runGuard(val, name + '.' + key);
        if(resp.length > 0) {
          res.push(resp);
        } 
      } else {
        if(mobileRegex.test(val)) {
          res.push({
            'path' : name + '.' + key,
            'val'  : val,
            'alert': 'Mobile Number'
          });
        } else if(panRegex.test(val)) {
          res.push({
            'path' : name + '.' + key,
            'val'  : val,
            'alert': 'Pan Card'
          });
        } else if(emailRegex.test(val)) {
          res.push({
            'path' : name + '.' + key,
            'val'  : val,
            'alert': 'Email'
          });
        } else if(pinCodeRegex.test(val)) {
          res.push({
            'path' : name + '.' + key,
            'val'  : val,
            'alert': 'Pin Code'
          });
        }
      }
    })
    return res;
}

// JSON searching algorithm
/**
 * Todo -
 * - Kind of flatten the list 
 * - show on the UI, home => param => 'mobile number found'
 * - Home page, show total number of alerts found
 * - On click -> show complete values where it was found
 * - Keep storage - save it to local storage or some where (is it possible?)
 * - Allow user to download the report
 * - report should be able to show page wise + API wise + data wise (what was exposed)
 * - User should be able to add regex their own regex with custom names
 * - Should be able to check and uncheck regex (mobile, PAN)
 * - Only xhr requests? figure out?
 * - Use should be able to filter out based on end point
 * - 
 * 
 * - A lot more to go here, just implement first!
 * 
 */