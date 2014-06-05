<?php
return function(\Slim\Slim $app) {
    $app->get('/video', function() use($app) {
        $app->render('video.html', ['page' => 'video']);
    })->name('video');
    $app->get('/', function() use($app) {
        $app->render('home.html', ['page' => 'home']);
    })->name('home');
};
