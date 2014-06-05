photohack-mythical-sushi-fun
============================

The Totally OutLandish PhotoHack website.

Example apache vHost
<VirtualHost *:80>
    ServerName local.photohack.com
	DocumentRoot {PATH_TO_CODE}/public
</VirtualHost>

<Directory {PATH_TO_CODE}/public>
    Options Indexes FollowSymLinks
	AllowOverride None
	Require all granted
</Directory>
