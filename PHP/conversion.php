<?php

// converts file from ANSI to UTF-8

$input_file = 'clients.txt';
$output_file = 'clients.txt';
$ansi_content = file_get_contents($input_file);
$unicode_content = iconv('WINDOWS-1253', 'UTF-8', $ansi_content);
file_put_contents($output_file, $unicode_content);
echo "File converted and saved as $output_file";