# Binary name
ProjectName := ecoflow-powerstream-nodejs
REGISTRY := flexy2dd

build:
	@echo "Building docker image $(ProjectName)"
	docker build --rm --progress plain --tag $(ProjectName) .
.PHONY: build

clean-all:
	@echo "Clean docker image $(ProjectName)"
	@docker rm -v $(ProjectName)
	@docker rmi $(ProjectName)
.PHONY: clean-all
	
exec:
	@echo "Exec docker image $(ProjectName)"
	docker exec -t -i $(ProjectName) /bin/bash
.PHONY: exec

run-bridge:
	@echo "Running docker image $(ProjectName)"
	docker run -p 8888:8000 --dns 8.8.8.8 --rm -it --name $(ProjectName) -d $(ProjectName)
.PHONY: run

run-host:
	@echo "Running docker image $(ProjectName)"
	docker run --net=host --dns 8.8.8.8 --rm -it --name $(ProjectName) -d $(ProjectName)
.PHONY: run

logs:
	@echo "View logs of docker process $(ProjectName)"
	docker logs $(ProjectName) -f
.PHONY: logs

kill:
	@echo "Kill docker process $(ProjectName)"
	docker kill $(ProjectName)
.PHONY: kill

tag:
	@echo "tag docker image $(ProjectName)"
	docker tag $(ProjectName) $(REGISTRY)/$(ProjectName)
.PHONY: tag

push:
	@echo "push docker image $(ProjectName)"
	docker push $(REGISTRY)/$(ProjectName)
.PHONY: push
