var sys = require('util'),
    http= require ('http'),
    request = require('request');

if (typeof process.env.DKRON_URL === 'undefined') {
   throw new Error("Please provide DKRON_URL environnement variable");
}

DKRON_URL= process.env.DKRON_URL,
DKRON_USERNAME= process.env.DKRON_USERNAME,
DKRON_PASSWORD= process.env.DKRON_PASSWORD;

function getTimestamp(date){

  if(date!="0001-01-01T00:00:00Z"){
    var processed_date=new Date(date).getTime();
      if(processed_date){
        return processed_date;
    }
  }else{
    return 0;
  }
}

function getValuesFromDkron(DKRON_URL, DKRON_USERNAME, DKRON_PASSWORD, callback){
  var request = require("request");
  var EventEmitter = require("events").EventEmitter;
  var options = {
    method: 'GET',
    url: DKRON_URL+'/v1/jobs/',
   };
if(typeof DKRON_USERNAME !== 'undefined'){
  options["headers"] = {"Authorization":"Basic " + new Buffer(DKRON_USERNAME + ":" + DKRON_PASSWORD).toString("base64")};
}
request(options, function (error, response, data) {
  if (error) throw new Error(error);
  callback(JSON.parse(data));
  });
}

http.createServer(function(req, res){

  var parts = req.url.split("/"), path=parts[1];
  if (path=="metrics") {
    console.log("looking for some "+path);
    res.writeHead(200,{'Content-Type':'text/plain'});
    getValuesFromDkron(DKRON_URL, DKRON_USERNAME, DKRON_PASSWORD, function(jobs){
        var tab={
          'jobs_error':[],
          'job_error_count':[],
          'job_success_count':[],
          'job_last_error':[],
          'job_last_success':[]
        };
         var result= "";
         jobs.forEach(function (arrayItem)
              {
                var error=(getTimestamp(arrayItem.last_success)>=getTimestamp(arrayItem.last_error))?"0":"1";
                tab.jobs_error.push("{job_name=\""+arrayItem.name+"\"} "+ error);
                tab.job_error_count.push("{job_name=\""+arrayItem.name+"\"} "+arrayItem.error_count);
                tab.job_success_count.push("{job_name=\""+arrayItem.name+"\"} "+arrayItem.success_count);
                tab.job_last_error.push("{job_name=\""+arrayItem.name+"\"} "+getTimestamp(arrayItem.last_error));
                tab.job_last_success.push("{job_name=\""+arrayItem.name+"\"} "+getTimestamp(arrayItem.last_success));

              }
            );

            result+= "# HELP dkron_jobs_error Is the Job in error ?\n";
            result+= "# TYPE dkron_jobs_error gauge \n";
            for (var i = 0; i < tab.jobs_error.length; i++) {
              result+= "dkron_jobs_error"+tab.jobs_error[i]+"\n";
            }

            result+= "# HELP dkron_job_error_count counter of errors for those jobs\n";
            result+= "# TYPE dkron_job_error_count counter\n";
            for (var i = 0; i < tab.job_error_count.length; i++) {
              result+= "dkron_job_error_count"+tab.job_error_count[i]+"\n";
            }

            result+= "# HELP dkron_job_success_count counter of success for those jobs\n";
            result+= "# TYPE dkron_job_success_count counter\n";
            for (var i = 0; i < tab.job_success_count.length; i++) {
              result+= "dkron_job_success_count"+tab.job_success_count[i]+"\n";
            }

            result+= "# HELP dkron_job_last_error last error date for those jobs\n";
            result+= "# TYPE dkron_job_last_error gauge\n";
            for (var i = 0; i < tab.job_last_error.length; i++) {
              result+= "dkron_job_last_error"+tab.job_last_error[i]+"\n";
            }

            result+= "# HELP dkron_job_last_success date of success for those jobs\n";
            result+= "# TYPE dkron_job_last_success gauge\n";
            for (var i = 0; i < tab.job_last_success.length; i++) {
              result+= "dkron_job_last_success "+tab.job_last_success[i]+"\n";
            }
            res.write(result);
            res.end();
      });
  }//if metrics
  else{ // for prometheus HealthCheck
    res.writeHead(200,{'Content-Type':'text/html'});
    res.write("<html><head><title>Dkron Exporter</title></head><body><h1>Dkron Exporter</h1><p><a href='/metrics'>Metrics</a></p></body></html>");
    res.end();
    console.log("Got Healtcheck Request on /");
  }
}).listen(9001);
console.log("Server is running on port 9001 with DKRON URL : "+DKRON_URL);
