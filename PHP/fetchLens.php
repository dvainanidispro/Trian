<?php

////* PARAMETERS

// File to put the data
$file_name = __DIR__ . '/lens.json';

// "name" of this query
$SqlName = "ItemsData2";

// Load .env file
$envFilePath = __DIR__ . '/.env';
if (file_exists($envFilePath)) {
    $env = parse_ini_file($envFilePath);
    foreach ($env as $key => $value) {
        putenv("$key=$value");
    }
} else {
    echo 'Error loading data. Missing .env file';
    exit;
}

// Access environment variables
$url = getenv('SOFTONEURL');
$client_id = getenv('CLIENTID');
$app_id = getenv('APPID');


// Data to send in the request body
$data = array(
    "service" => "SqlData",
    "clientID" => $client_id,
    "appId" => $app_id,
    "SqlName" => $SqlName,
    "page" => 0,
    "rowofpage" => 9999999
);


////* SEND REQUEST

// Convert data to JSON format
$data_json = json_encode($data);


// Initialize cURL session
$ch = curl_init();

// Set cURL options
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data_json);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($ch, CURLOPT_ENCODING , '');        // Dim: Because of gzip response

// Execute cURL session and get the response
$response = curl_exec($ch);

// Check for cURL errors
if (curl_errno($ch)) {
    echo 'Error making the request: ' . curl_error($ch);
    exit;
}

// Close cURL session
curl_close($ch);


////* HANDLE RESPONSE

//* Dim: Convert from WINDOWS-1253 (Greek ANSI) to UTF-8
$response = iconv('WINDOWS-1253', 'UTF-8', $response);
// $response_data = $response;

// Decode the response JSON to an associative array
$response_json = json_decode($response, true);
// Now response_json is an obejct! For example $response_json['success']==true
echo 'Imported '.$response_json['totalcount']. ' items from SoftOne.';
echo ("\n");    // new line in console


// Save the response body to the clients.json file
$response = json_encode($response_json['rows'],JSON_UNESCAPED_UNICODE);
if (file_put_contents($file_name, $response)) {
    echo 'Response saved to '.$file_name;
} else {
    echo 'Error saving the response body to '.$file_name;
}