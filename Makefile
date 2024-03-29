#################################
# Application workflow
#################################

SERVICES=exim spamassassin mongo dns api rabbitmq workspace

# Run all containers
.PHONY: up
up:
	@docker-compose up -d ${SERVICES}

# Stop all containers
down:
	@docker-compose down

restart: down up

.PHONY: rebuild
rebuild:
	@docker-compose up -d --build ${SERVICES}

# Reload all services
.PHONY: reload
reload: reload-spamassassin reload-exim reload-api reload-dns

reload-spamassassin:
	@docker-compose exec spamassassin sh -c 'kill -HUP `cat /var/run/spamd.pid`'

reload-exim:
	@docker-compose exec exim sh -c 'kill -HUP `cat /run/exim.pid`'

reload-api:
	@docker-compose exec api pm2 restart all

reload-dns:
	@docker-compose exec dns unbound-control reload

#################################
# Test and debug
#################################

# Runs all tests
.PHONY: test
test: test-unit-mocha test-integration-bash

# Runs unit test
test-unit-mocha:
	@docker-compose up -d ${SERVICES}
	@docker-compose exec api mocha

# Runs integration test
.PHONY: test-integration-bash
test-integration-bash:
	@docker-compose up workspace
	@docker-compose exec workspace bash /srv/test.sh

# Runs test container for debug purposes
.PHONY: workspace
workspace:
	@docker-compose exec --user=develop workspace zsh

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
	@docker-compose run workspace sh -c "/srv/checkdelivery-send.sh"

.PHONY: dns-clear-cache
dns-clear-cache:
	@docker-compose exec dns sh -c "unbound-control flush_zone ."

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
mail-stats:
	@echo Num mails:
	@echo `docker-compose exec mongo mongosh mailbroker --quiet --eval 'db.mails.countDocuments({});'`
