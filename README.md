# DQ
#to initialize locally
#cd to location where install repos locally...
git clone https://www.github.com/CreateIO/DQ
mkdir DQMatchSetsLocal
cd DQ
mkdir logs
# assumes already have npm and node installed
npm install

#to run locally
./run_dq.sh
##OLD or to run in foreground: source source ./dq_env.sh
##OLD or to run in foreground: npm start
#to kill (stop DQ server) if use script (warning: assumes don't have other node processes running, like local TRex or create server):
killall node

#Steps for installation on ubuntu server
cd /data
sudo mkdir DQ
sudo chown ubuntu DQ
sudo mkdir DQMatchSetsLocal
sudo chown ubuntu DQMatchSetsLocal
cd DQ
git clone https://www.github.com/CreateIO/DQ
cd DQ

sudo apt-get install npm
sudo apt-get install node
#shouldn't need the following legacy node, but seems necessary...
sudo apt-get install nodejs-legacy
npm install

##NO LONGER NEEDED: git stash #(to push github-api changes brought in with library)
##NO LONGER NEEDED: git pull #(to overwrite github-api that came with lib)
mkdir logs

#configure for test or prod
#make sure that the environment file (dq_env.sh) is pointing to the production branch:
export GITHUB_TEMPLATE_BRANCH="test" (for dq-test.create.io server instance on TRex3 or TRex4)
export GITHUB_TEMPLATE_BRANCH="prod" (for dq.create.io server instance on TRex prod2 or TRex5)
#use sudo vim dq_env.sh to change above line if required

#setup routing for server
cd /etc/lighttpd/conf-enabled
sudo cp trex.conf dq.conf
sudo vim dq.conf
# and edit so have lines:
$HTTP["url"] =~ "^/DQ" {
  proxy.server  = ( "" => ("" => ( "host" => "127.0.0.1", "port" => 3000 )))
}
# and restart lighttpd
sudo service lighttpd restart

#To run in foreground on ubuntu
cd /data/DQ/DQ
source ./dq_env.sh
npm start

#to run in background
cd /data/DQ/DQ
source ./dq_env.sh
nohup npm start > logs/DQ.log &

#OR USE SCRIPTS (best choice)!
cd /data/DQ/DQ
./run_dq.sh

#DQMatchSet repository fetches:

Files pushed into the template folder become immediately accessable in the dq-test.create.io server using the DQ/template HTTPS GET call.
Files are normally cached locally on the server, but if that call includes "&cache=false", then a re-pull from the DQMatchSets repository
 will occur for each file accesed this way.

Note: the repository branch where pulls are made is currently set to 'master', but can be changed in the DQ server environment file (dq_env.sh)

Example calls to the DQ for template resources:
https://dq-test.create.io/DQ/template?resource=tabs-&version=1.0.0  (normal, use local cache if available)
https://dq-test.create.io/DQ/template?resource=tabs-&version=1.0.0&cache=false (do not use local cache, re-grab file from git repository
