# Troubleshooting

## How to verify the correct configuration of DKIM

```sh
# check for the file "dkim_private_key"
docker-compose exec exim sh -c "exim -bP transports | grep dkim"
# check domain
docker-compose exec exim hostname
# check variables
docker-compose exec exim env
```

## Outgoing emails is not send

1. Check for Mailer-Daemon reports: `docker-compose logs -t --tail=1000 api | grep "Mailer-Daemon"` and `docker-compose logs -t --tail=1000 exim | grep "host lookup did not complete"`

```
exim_1  DNS lookup of site.com (MX) succeeded                                               
exim_1  dnslookup router: defer for info@site.com                          
exim_1    message: host lookup did not complete                                             
exim_1  added retry item for R:site.com: errno=-1 more_errno=0 flags=0                                
exim_1  post-process info@site.com (1)                                       
exim_1  LOG: MAIN                                            
exim_1    == info@site.com R=dnslookup defer (-1): host lookup did not complete    
```


2. Check DNS server: `docker-compose run test-compose sh -c "dig MX site.com @10.1.0.105"`

```
2020-01-20T13:48:31.555661554Z [1579528111] unbound[10:3] error: SERVFAIL <site.com. MX IN>: all servers for this domain failed, at zone site.com.
```
