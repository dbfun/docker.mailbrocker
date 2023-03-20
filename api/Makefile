# @see https://engineering.docker.com/2019/06/containerizing-test-tooling-creating-your-dockerfile-and-makefile/

#################################
# Settings
#################################

MAJOR?=0
MINOR?=1
PATCH?=0

VERSION=$(MAJOR).$(MINOR).$(PATCH)

APP_NAME="mailbroker-api"
HUB_NAMESPACE="required"

DOCKERFILE="./Dockerfile"

#################################
# Variables
#################################

IMAGE_NAME="${APP_NAME}"
CUR_DIR=$(shell echo "${PWD}")

IMAGE_NAME_LATEST="${HUB_NAMESPACE}/${IMAGE_NAME}:latest"
IMAGE_NAME_VERSION="${HUB_NAMESPACE}/${IMAGE_NAME}:${VERSION}"

#################################
# Install targets
#################################

.PHONY: install-test
install-test: install-prerequirements install-npm

.PHONY: install-prerequirements
install-prerequirements:
	@sudo npm install --global pm2 mocha
	@sudo apt install -y spfquery dkimproxy opendmarc python3 python3-pip razor
	@sudo pip3 install pyzor

.PHONY: install-npm
install-npm:
	@echo "+ $@"
	@npm install

#################################
# Docker targets
#################################

.PHONY: clean-image
clean-image: version-check
	@docker rmi ${IMAGE_NAME_LATEST} || true
	@docker rmi ${IMAGE_NAME_VERSION} || true

.PHONY: image
image: version-check
	@docker build -t ${IMAGE_NAME_VERSION} -f ./${DOCKERFILE} .
	@docker tag ${IMAGE_NAME_VERSION} ${IMAGE_NAME_LATEST}
	@echo 'Done.'
	@docker images --format '{{.Repository}}:{{.Tag}}\t\t Built: {{.CreatedSince}}\t\tSize: {{.Size}}' | grep ${IMAGE_NAME}:${VERSION}

.PHONY: push
push: clean-image image
	@docker push ${IMAGE_NAME_LATEST}
	@docker push ${IMAGE_NAME_VERSION}

#################################
# test targets
#################################

.PHONY: test-unit
test-unit:
	npm run test

.PHONY: test-container
test-container: image
	@docker run --rm -it -v`pwd`/../test-letters:/test-letters ${IMAGE_NAME_LATEST} npm run test


#################################
# Utilities
#################################

.PHONY: version-check
version-check:
	if [ -z "${VERSION}" ]; then \
		echo "VERSION is not set" ; \
		false ; \
	else \
		echo "VERSION is ${VERSION}"; \
	fi
