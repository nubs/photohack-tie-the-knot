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
    RewriteEngine on
    RewriteCond %{SCRIPT_FILENAME} !-f
    RewriteRule ^ index.php [L]
    Options Indexes FollowSymLinks
    AllowOverride None
    Require all granted
</Directory>
```

### NginX
```nginx
server {
  listen 80;
  server_name local.photohack.com;

  root {PATH_TO_CODE}/public;
  index index.php;

  location / {
    try_files $uri @rewriteapp;
  }

  location @rewriteapp {
    rewrite ^(.*)$ /index.php/$1 last;
  }

  location ~ ^/index\.php(/|$) {
    fastcgi_pass heroku-fcgi;
    fastcgi_split_path_info ^(.+\.php)(/.*)$;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    fastcgi_param HTTPS off;
  }
}
```
