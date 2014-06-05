# photohack-mythical-sushi-fun
The Totally OutLandish PhotoHack website.

## Hosting
Production hosting on heroku (at http://photohack.herokuapp.com) is using the
heroku-provided php buildpack using nginx/php-fpm.  It should work under pretty
much any hosting though.

### Apache
```apache
<VirtualHost *:80>
    ServerName local.photohack.com
    DocumentRoot {PATH_TO_CODE}/public
</VirtualHost>

<Directory {PATH_TO_CODE}/public>
    Options Indexes FollowSymLinks
    AllowOverride None
    Require all granted
</Directory>
```
