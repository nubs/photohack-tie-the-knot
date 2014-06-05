<?php
return function($app) {
    $twigView = new \Slim\Views\Twig();
    $twigView->parserOptions = ['autoescape' => false];

    $app->config('templates.path', __DIR__ . '/templates');
    $view = $app->view($twigView);
    $view->parserExtensions = [new \Slim\Views\TwigExtension()];
};
