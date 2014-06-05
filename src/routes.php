<?php
return function(\Slim\Slim $app) {
    $app->get('/', function() use($app) {
        $app->render('home.html', ['page' => 'home']);
    })->name('home');
    $app->get('/employer', function() use($app) {
        $app->render('employer.html', ['page' => 'employer']);
    })->name('employer');
    $app->get('/video', function() use($app) {
        $app->render('video.html', ['page' => 'video']);
    })->name('video');
    $app->get('/form', function() use($app) {
        $app->render('form.html', ['page' => 'form']);
    })->name('form');
};
