# DQ

To initialize locally, `cd` to the location where you install repositories locally (`$HOME/src` or `$HOME/Documents` for example)

    cd $HOME/Documents
    git clone https://www.github.com/CreateIO/DQ
    cd DQ
    ./run_dq.sh

# Run locally in the background

    ./run_dq.sh

#Run in foreground: 
    source ./dq_env.sh
    npm start

## Stop DQ server

If you used the `run_dq.sh` script to start it:
**(warning: assumes you don't have other node processes running, like local TRex or create server)**:
    killall node

# Steps for installation on ubuntu server
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

    #configure for test or prod
    # make sure that the environment file (dq_env.sh) is pointing to the production branch:
    export GITHUB_TEMPLATE_BRANCH="test" (for dq-test.create.io server instance on TRex3 or TRex4)
    export GITHUB_TEMPLATE_BRANCH="prod" (for dq.create.io server instance on TRex prod2 or TRex5)
	#use sudo vim dq_env.sh to change above line if required

## Set up routing for server
    
    cd /etc/lighttpd/conf-enabled
    sudo cp trex.conf dq.conf
    sudo vim dq.conf
Edit so that it has these lines:
    $HTTP["url"] =~ "^/DQ" {
      proxy.server  = ( "" => ("" => ( "host" => "127.0.0.1", "port" => 3000 )))
    }
and restart lighttpd
	sudo service lighttpd restart

## To run in foreground on ubuntu
    cd /data/DQ/DQ
    source ./dq_env.sh
	npm start

## To run in the background on ubuntu
    cd /data/DQ/DQ
    source ./dq_env.sh
	nohup npm start > logs/DQ.log &

## OR USE SCRIPTS (best choice)!
    cd /data/DQ/DQ
	./run_dq.sh

#DQMatchSet repository fetches:

Files pushed into the template folder become immediately accessable in the dq-test.create.io server using the DQ/template HTTPS GET call.

Files are normally cached locally on the server, but if that call includes "&cache=false", then a re-pull from the DQMatchSets repository will occur for each file accesed this way.


Note: the repository branch where pulls are made is currently set to 'test', but can be changed in the DQ server environment file (dq_env.sh), and can be overridden by using the optional branch in the DQService call.

Example calls to the DQ for template resources:
URL | Description
----|------------
https://dq-test.create.io/DQ/template?resource=tabs-&version=1.0.0 | Normal, use local cache if available)
https://dq-test.create.io/DQ/template?resource=tabs-&version=1.0.0&cache=false&branch=my_branch | Pull from my_branch; do not use local cache, re-grab file from git repository
