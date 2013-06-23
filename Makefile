FINAL=learn-node-mongo-the-hard-way
SOURCE=book
WEBSITE=learnmongodbthehardway.com

book:
	dexy

view: $(FINAL).pdf
	evince $(FINAL).pdf

sync: book
	rsync -avz --delete --exclude "scripts/"* --exclude "${FINAL}.*" output/ $(WEBSITE)/book

publish_to_github:
	rm -rf ./publish_github
	git clone git@github.com:christkv/learn-node-mongo-the-hard-way.git publish_github
	git --git-dir=./publish_github/.git --work-tree=./publish_github checkout gh-pages
	cp -r ./output/* ./publish_github/.
	git --git-dir=./publish_github/.git --work-tree=./publish_github add .
	git --git-dir=./publish_github/.git --work-tree=./publish_github commit -a -m "Updated book"
	git --git-dir=./publish_github/.git --work-tree=./publish_github push origin gh-pages
	rm -rf ./publish_github