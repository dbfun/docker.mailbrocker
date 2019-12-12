#################################
# Application workflow
#################################

# Run all containers
.PHONY: up
up:
	@docker-compose up -d --build

# Stop all containers
down:
	@docker-compose down

# Reload all services
.PHONY: reload
reload:
	@docker-compose exec spamassassin sh -c 'kill -HUP `cat /var/run/spamd.pid`'
	@docker-compose exec exim sh -c 'kill -HUP `cat /run/exim.pid`'
	@docker-compose exec api sh -c 'pm2 restart all'
	@docker-compose exec dns sh -c 'unbound-control reload'

#################################
# Test and debug
#################################

# Runs all tests
.PHONY: test
test: test-unit-mocha test-compose

# Runs unit test
test-unit-mocha:
	@docker-compose up -d
	@docker-compose exec api mocha

# Runs integration test
.PHONY: test-compose
test-compose:
	@RUN_TESTS=on docker-compose up test-compose
	@docker-compose logs -tf --tail=0 test-compose

# Runs test container for debug purposes
.PHONY: debug-compose
debug-compose:
	@docker-compose run test-compose sh

# Attach to api container (or run: `docker-compose exec api sh`)
.PHONY: attach-api
attach-api:
	./attach.sh api


#################################
# Utils
#################################

# Shows DKIM public key
.PHONY: exim-dkim
exim-dkim:
	@docker-compose exec exim sh /srv/dkim-show-public-key.sh

# Check IP in Blacklists (make tools-blacklist IP=127.0.0.2)
.PHONY: tools-blacklist
tools-blacklist:
	@docker-compose exec api node tools/blacklist.js ${IP}

# Check IP in Blacklists (make tools-blacklist IP=127.0.0.2)
.PHONY: swaks-checkdelivery
swaks-checkdelivery:
	@docker-compose run test-compose sh -c "/srv/checkdelivery-send.sh"


#################################
# Stats
#################################

# Shows exim stats
.PHONY: exim-stats
exim-stats:
	@echo mail queue:
	@docker-compose exec exim exim -bp
	@echo exiwhat:
	@docker-compose exec exim exiwhat

# Shows dns stats
.PHONY: dns-stats
dns-stats:
	@docker-compose exec dns sh -c 'unbound-control stats_noreset; echo; unbound-control status'

# Shows dns cache
.PHONY: dns-cache
dns-cache:
	@docker-compose exec dns unbound-control dump_cache

# Shows mail count
.PHONY: mail-stats
mail-count:
	@echo Num mails: `docker-compose exec mongo mongo mailtester --quiet --eval 'db.mails.count({});'`

