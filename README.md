# DQ


To initialize locally, `cd` to the location where you install repositories locally (`$HOME/src` or `$HOME/Documents` for example)

    cd $HOME/Documents
    git clone https://www.github.com/CreateIO/DQ
    cd DQ
    ./run_dq.sh

# Run locally for development (runs the DQ in supervisor mode) in the background
    ./run_dq.sh dev


## Stop DQ server (note: running ./run_dq.sh will automatically kill the running instance prior to restrarting it)

If you used the `run_dq.sh` script to start it:
    ./scripts/kill.sh


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
    # make sure there is an AWS SQS queue for the server (they have been created for trex2 through trex5) -- in AWS console SQS settings
    # make sure that the URL for the server correctly matchs the AWS_SQS_URL configured for that server (change trex2 to server as required):
    export AWS_SQS_URL="https://sqs.us-east-1.amazonaws.com/249035392509/DQMatchSets-trex2"
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

## To upgrade the server to a new version or to revert to an old version
    --disconnect server you are updating from the AWS EC2 load balancer for dq-test or dq-prod
    cd /data/DQ/DQ
    ./run_dq.sh
    git stash               # dq_env.sh is different on each server
    git co branch-you-want  #NOTE: this step is normally not necessary unless you wish to pull from something other than 'master'
    git pull
    npm update              #typically not required unless changes have been made to npm modules
    vim dq_env.sh           #edit dq_env.sh to insure settings correct for server instance...  There are two settings that
                            #    might need to be altered:
                            #     DB_HOST= to either dq-test... or dq-prod...
                            #     AWS_SQS_URL= to ...-trexN (where N = the instance you are updating)
    ./run_dq.sh
    test/sandbox_tests.sh   # Runs tests on all dq endpoints.  You should not see any errors
    --reconnect erver you just updating from the AWS EC2 load balancer for dq-test or dq-prod

## To run in the background on ubuntu (NOT in supervisor mode so can kill cleanly if needed)
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

# Legal

Copyright (C) 2015 Create, Inc. All Rights Reserved.

This code is based in part on a [blog
article](http://mherman.org/blog/2015/02/12/postgresql-and-nodejs/). The code
from that article is available [on
Github](https://github.com/mjhea0/node-postgres-todo/pull/4) under an 
[MIT license](https://github.com/mjhea0/node-postgres-todo/blob/master/LICENSE):


> The MIT License
> 
> Copyright (c) 2015 Michael Herman http://www.mherman.org/
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
> 
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
> 
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.

