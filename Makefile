FINAL=learn-node-mongo-the-hard-way
SOURCE=book
WEBSITE=learnmongodbthehardway.com

book:
	dexy

view: $(FINAL).pdf
	evince $(FINAL).pdf

sync: book
	rsync -avz --delete --exclude "scripts/"* --exclude "${FINAL}.*" output/ $(WEBSITE)/book
