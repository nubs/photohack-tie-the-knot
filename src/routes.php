<?php
//

return function(\Slim\Slim $app) {
    $app->get('/', function() use($app) {
        $app->render('home.html', ['page' => 'home']);
    })->name('home');

    $app->get('/employer', function() use($app) {
        $app->render('employer.html', ['page' => 'employer','foo'=>'EMPLOYEES']);
    })->name('employer');

    $app->post('/video', function() use($app) {
        $name = $app->request->post('fname');
        $title = $app->request->post('title');
        $app->render('video.html', ['page' => 'video', 'vidname' => $name, 'vidtitle' => $title]);
    })->name('video');

    $app->get('/form', function() use($app) {
        $app->render('form.html', ['page' => 'form']);
    })->name('form');

    $app->get('/share', function() use($app) {
        $app->render('share.html', ['page' => 'share']);
    })->name('share');

    $app->post('/submit', function() use($app) {
        $app->contentType('application/json');
        $tmpDir = uniqid();
        $audioFile = "/tmp/{$tmpDir}/audio.wav";
        $frameBase = "/tmp/{$tmpDir}/frame";
        $outputFile = "/tmp/{$tmpDir}/output.webm";
        mkdir("/tmp/{$tmpDir}");
        $data = json_decode($app->request->getBody(), true);
        $videoFrames = $data['video'];
        foreach ($videoFrames as $index => $frame) {
            file_put_contents("{$frameBase}{$index}.jpg", base64_decode(substr($frame, strpos($frame, ',') + 1)));
        }

        $audioData = $data['audio'];
        file_put_contents($audioFile, base64_decode(substr($audioData, strpos($audioData, ',') + 1)));

        exec("ffmpeg -i {$audioFile} -i {$frameBase}%d.jpg -r 25 -bufsize 10000k -threads 32 {$outputFile}");
        $app->response->setBody(base64_encode(file_get_contents($outputFile)));
    })->name('submit');
};
