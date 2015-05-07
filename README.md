# DQ
Soft serves user data and delicious toppings

   *  Express
 
        npm update -g express
        npm update -g express-generator

        npm install


        npm start

#Steps for installation on ubuntu server
cd /data
sudo mkdir DQ
sudo chown ubuntu DQ
cd DQ
git clone https://www.github.com/CreateIO/DQ
cd DQ
sudo apt-get install npm
sudo apt-get install node
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
npm start

#to run in background
cd /data/DQ/DQ
nohup npm start > logs/DQ.log &