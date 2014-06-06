<?php
use TOL\PhotoHack\Youtube;

return function($app) {
    $twigView = new \Slim\Views\Twig();
    $twigView->parserOptions = ['autoescape' => false];

    $app->config('templates.path', __DIR__ . '/templates');
    $view = $app->view($twigView);
    $view->parserExtensions = [new \Slim\Views\TwigExtension()];

    $app->container->singleton('youtube', function() {
        $client = new Google_Client();
        $client->setClientId(getenv('YOUTUBE_CLIENT_ID'));
        $client->setClientSecret(getenv('YOUTUBE_CLIENT_SECRET'));
        $client->setScopes('https://www.googleapis.com/auth/youtube');
        $client->setRedirectUri('http://photohack.herokuapp.com/share');

        return new Youtube($client);
    });
};
