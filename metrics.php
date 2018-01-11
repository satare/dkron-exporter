<?php

// Get the configuration

  define(DKRON_URL,"http://localhost");
  define(DKRON_PORT,"8082"); //9001


$DKRON_URL=DKRON_URL;
$DKRON_PORT=DKRON_PORT;
//Variables
$path="/v1/jobs";
//Curl...

$urlToCall=$DKRON_URL.":".$DKRON_PORT.$path;
$urlToCall="http://localhost:8082";


$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_PORT => "8082",
  CURLOPT_URL => "$urlToCall",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "GET",
  CURLOPT_HTTPHEADER => array(
    "Cache-Control: no-cache",
    "Postman-Token: 693f4248-57a6-55f1-f539-fc470bcc57cd"
  ),
));

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  $response=json_decode($response);
}


foreach($response as $job){
  // work on the results
  $error=(getTimestamp($job->last_success)<getTimestamp($job->last_error))?"0":"1";
  $tab["jobs_error"][]="{\"job_name\"=".$job->name."} ". $error;
  $tab["job_error_count"][]="{\"job_name\"=".$job->name."} ".$job->error_count;
  $tab["job_success_count"][]="{\"job_name\"=".$job->name."} ".$job->success_count;
  $tab["job_last_error"][]="{\"job_name\"=".$job->name."} ".getTimestamp($job->last_error);
  $tab["job_last_success"][]="{\"job_name\"=".$job->name."} ".getTimestamp($job->last_success);
}
# HELP http_requests_total The total number of HTTP requests.
# TYPE http_requests_total counter
  echo "# HELP jobs_error Is the Job in error ?\n";
  echo "# TYPE jobs_error gaughe \n";
foreach($tab["jobs_error"] as $value){
    echo"jobs_error ".$value."\n";
  }

echo "# HELP job_error_count counter of errors for those jobs\n";
echo "# TYPE job_error_count counter\n";
foreach($tab["job_error_count"] as $value){
  echo"job_error_count ".$value."\n";
}

echo "# HELP job_success_count counter of success for those jobs\n";
echo "# TYPE job_success_count counter\n";
foreach($tab["job_success_count"] as $value){
  echo"job_success_count ".$value."\n";
}

echo "# HELP job_last_error last error date for those jobs\n";
echo "# TYPE job_last_error gauge\n";
foreach($tab["job_last_error"] as $value){
  echo"job_last_error ".$value."\n";
}

echo "# HELP job_last_success date of success for those jobs\n";
echo "# TYPE job_last_success gauge\n";
foreach($tab["job_last_success"] as $value){
  echo"job_last_success ".$value."\n";
}




function getTimestamp($date=null){
  if(isset($date)){
    return strtotime($date);
  }else{
    return time();
  }
}
?>
