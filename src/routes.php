<?php

return function(\Slim\Slim $app) {
    $app->get('/', function() use($app) {
        $app->render('home.html', ['page' => 'home']);
    })->name('home');

    $app->get('/employer', function() use($app) {
        $app->render('employer.html', ['page' => 'employer','foo'=>'EMPLOYEES']);
    })->name('employer');

    $app->post('/video', function() use($app) {
        $names = $app->request->post('names');
        $message = $app->request->post('message');
        $app->setCookie('formInfo', json_encode(['vidname' => $names, 'vidtitle' => $message]));
        $app->render('video.html', ['page' => 'video', 'vidname' => $names, 'vidtitle' =>  $message]);
    })->name('video');

    $app->get('/form', function() use($app) {
        $app->render('form.html', ['page' => 'form']);
    })->name('form');

    $app->get('/share', function() use($app) {
        try {
            $token = $app->client->authenticate($app->request->get('code'));
            if ($token) {
                $app->setCookie('token', $token);
            }
        } catch (\Exception $e) {
            // Do nothing
        }

        $app->render('share.html', ['page' => 'share']);
    })->name('share');

    $app->post('/submit', function() use($app) {
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
        $app->response->setBody(json_encode(['video' => base64_encode(file_get_contents($outputFile)), 'id' => $tmpDir]));
    })->name('submit');

    $app->post('/youtube', function() use($app) {
        $youtube = $app->youtube;
        $formInfo = json_decode($app->getCookie('formInfo'), true);
        $videoId = $youtube->uploadVideo(
            "/tmp/{$app->request->post('id')}/output.webm", 
            "{$formInfo['vidname']}'s Guestbook Entry",
            "Greetings from {$formInfo['vidname']}.",
             ['guestbook', 'photoHack', 'Dominion Enterprises', 'Hackathon', 'Postage Stamp Moisturizer']
        );

        $app->response->setBody(json_encode(['youtubeUrl' => "https://www.youtube.com/watch?v={$videoId}"]));
    })->name('youtube');

    $app->get('/getYoutubeAuthUrl', function() use($app) {
        $app->response->redirect($app->client->createAuthUrl(), 301);
    })->name('youtubeAuthUrl');
};
