---
id: webserver
title: Webserver Setup
slug: /webserver
sidebar_position: 100
---

This page outlines how to run Talawa API on a cloud based server using SSL certificates.

## Apache

This is the Apache webserver configuration we use for the https://api-test.talawa.io/ website that uses SSL.

You can use these configuration examples for your website.

### Redirecting HTTP Traffic to HTTPS

The first configuration we use redirects HTTP traffic to the HTTPS site.

You will need to:

1. Adjust the IPv4 and IPv6 addresses in the `<VirtualHost>` line to match your server settings.
2. Update the following configuration lines to the DNS name of your system.
   1. `ServerName`
   2. `Redirect`

```
<VirtualHost 50.62.181.102:80 [2603:3:6100:af0::]:80>
  ServerName api-test.talawa.io
  Redirect / https://api-test.talawa.io/
</VirtualHost>
```

The next section outlines the HTTPS site setup.

### SSL Setup

You will need to:

1. Adjust the IPv4 and IPv6 addresses in the `<VirtualHost>` line to match your server settings.
1. Enable the following pre-requisite apache modules using these commands:
   ```
   sudo a2enmod proxy_wstunnel
   sudo a2enmod proxy_http
   sudo a2enmod proxy
   sudo a2enmod ssl
   sudo systemctl restart apache2
   ```
1. Update the `ServerName` to the DNS name of your system.
1. Update the location of your SSL certificates and keys.
1. Update the logfile names
1. Update the `Header set Access-Control-Allow-Origin` configuration line to the host serving the Talawa-Admin site.
   1. **Note:** This needs to be updated in 2 locations.

```text
<VirtualHost 50.62.181.102:443 [2603:3:6100:af0::]:443>
  ##############################################################################
  # api-test.talawa.io (Talawa-Admin HTTPS on port 443)
  ##############################################################################

  ServerName  api-test.talawa.io

  ##############################################################################
  # Proxy (Requires these commands to activate)
  # "a2enmod proxy_wstunnel" "a2enmod proxy_http" "a2enmod proxy"
  ##############################################################################

  # Setup the proxy configuration
  ProxyPreserveHost On

  # Web proxy (API GraphQL endpoint)
  ProxyPass /graphql http://localhost:4000/graphql
  ProxyPassReverse /graphql http://localhost:4000/graphql

  # Web proxy (API GraphiQL endpoint)
  ProxyPass /graphiql http://localhost:4000/graphiql
  ProxyPassReverse /graphiql http://localhost:4000/graphiql

  ##############################################################################
  # SSL (Requires command "a2enmod ssl" to activate)
  ##############################################################################

  SSLEngine on

  # This file changes each year
  SSLCertificateFile /path/to/ssl/certificate/location/certificate.crt

  # These files don't change year to year
  SSLCertificateChainFile /path/to/ssl/certificate/location/chain.crt
  SSLCertificateKeyFile /path/to/ssl/certificate/location/private.txt

  ##############################################################################
  # Logging
  ##############################################################################

  LogLevel warn
  ErrorLog /var/log/apache2/api-test.talawa.io_error.log
  CustomLog /var/log/apache2/api-test.talawa.io_access.log combined

  ##############################################################################
  # Locations (Talawa-API)
  ##############################################################################

  <Location "/graphql">

    ###########################################################################
    # CORS Headers (Requires command "a2enmod headers" to activate)
    ###########################################################################

    # Enable Cross Origin Resource Sharing (CORS)
    # Set Access-Control-Allow-Origin (CORS) Header

    Header set Access-Control-Allow-Origin "https://test.talawa.io"

  </Location>

  <Location "/graphiql">

    ###########################################################################
    # CORS Headers (Requires command "a2enmod headers" to activate)
    ###########################################################################

    # Enable Cross Origin Resource Sharing (CORS)
    # Set Access-Control-Allow-Origin (CORS) Header

    Header set Access-Control-Allow-Origin "https://test.talawa.io"

  </Location>

</VirtualHost>


```
