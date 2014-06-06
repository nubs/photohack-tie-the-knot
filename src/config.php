<?php
use TOL\PhotoHack\Youtube;

return function($app) {
    $twigView = new \Slim\Views\Twig();
    $twigView->parserOptions = ['autoescape' => false];

    $app->config('templates.path', __DIR__ . '/templates');
    $view = $app->view($twigView);
    $view->parserExtensions = [new \Slim\Views\TwigExtension()];

    $app->container->singleton('youtube', function() use($app) {
        return new Youtube($app->client);
    });

    $app->container->singleton('client', function() use($app) {
        $client = new Google_Client();
        $client->setClientId(getenv('YOUTUBE_CLIENT_ID'));
        $client->setClientSecret(getenv('YOUTUBE_CLIENT_SECRET'));
        $client->setScopes('https://www.googleapis.com/auth/youtube');
        $client->setRedirectUri('http://local.photohack.com/share');
        $token = $app->getCookie('token');
        if ($token) {
            $client->setAccessToken($token);
        }

        return $client;
    });
};
