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
source source ./dq_env.sh
npm start

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
mkdir logs

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

#OR USE SCRIPTS!
cd /data/DQ/DQ
./run_dq.sh