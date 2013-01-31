make html
cp -R _build/html/ ~/coding/checkout/learn-node-mongo-the-hard-way/.
cd ~/coding/checkout/learn-node-mongo-the-hard-way
git commit -a -m "Updated book"
git push gh-pages
cd ~/coding/projects/learn-node-mongo-the-hard-way
