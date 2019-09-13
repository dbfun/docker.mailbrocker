#################################
# Settings
#################################

# Run all containers
.PHONY: up
up:
	@docker-compose up -d --build

# Stop all containers
down:
	@docker-compose down

# Runs test container separately
.PHONY: test-compose
test-compose:
	@docker-compose up test-compose
	@docker-compose logs -tf --tail=0 test-compose

# Runs test container for debug purposes
.PHONY: debug-compose
debug-compose:
	@docker-compose run test-compose sh

# Shows exim status
.PHONY: exim
exim: exim-bp

# Shows exim queue
.PHONY: exim-bp
exim-bp:
	@echo Queue:
	@docker-compose exec exim exim -bp

# Shows mails status
.PHONY: mail
mail:	mail-count

# Shows mail count
.PHONY: mail-count
mail-count:
	@echo Num mails: `docker-compose exec mongo mongo mailtester --quiet --eval 'db.mails.count({});'`

# Reload all services
.PHONY: reload
reload:
	@docker-compose exec spamassassin sh -c 'kill -HUP `cat /var/run/spamd.pid`'
	@docker-compose exec exim sh -c 'kill -HUP `cat /run/exim.pid`'
	@docker-compose exec api sh -c 'pm2 restart all'

.PHONY: attach-api
attach-api:
	./attach.sh api
