
"use strict";
/*jslint browser: true, nomen: true*/
/*global define*/

define([], function () {
    return function (frame) {
        var player = frame.player(),
            layout = frame.layout(),
            model = function() { return frame.model(); },
            client = function(id) { return frame.model().clients.find(id); },
            node = function(id) { return frame.model().nodes.find(id); },
            cluster = function(value) { model().nodes.toArray().forEach(function(node) { node.cluster(value); }); },
            wait = function() { var self = this; model().controls.show(function() { self.stop(); }); },
            subtitle = function(s, pause) { model().subtitle = s + model().controls.html(); layout.invalidate(); if (pause === undefined) { model().controls.show() }; };

        //------------------------------
        // Title
        //------------------------------
        frame.after(1, function() {
            model().clear();
            layout.invalidate();
        })
        .after(500, function () {
            frame.model().title = '<h2 style="visibility:visible">Error Cases</h1>'
                                + '<br/>' + frame.model().controls.html();
            layout.invalidate();
        })
        .after(200, wait).indefinite()
        .after(500, function () {
            model().title = '';
            layout.invalidate();
        })

        //------------------------------
        // Initialization
        //------------------------------
        .after(300, function () {
            model().nodes.create('A');
            model().nodes.create('B');
            model().nodes.create('C');
            cluster(['A', 'B', 'C']);
        })
        .after(1, function () {
            model().ensureSingleProposer();
            model().subtitle = '<h2>In Paxos there are a number of different failure cases.</h2>'
                           + model().controls.html();
            layout.invalidate();
        })

        //------------------------------
        // Failure of Acceptor
        //------------------------------
        .after(100, function () {
            subtitle('<h2>First is the failure of a non majority of <em>Acceptor</em>s</h2>');
        })
        .after(1, function() {
            subtitle('', false);
        })
        .after(1, function() {
            subtitle('<h2>The system is up and running with a <span style="color:green">client</span> making requests</h2>'); 
            frame.model().clients.create('X');
            layout.invalidate();
        })
        .after(300, function () {
            frame.snapshot();
            client('X').value('4')
            layout.invalidate();
        })
        .after(500, function () {
            frame.model().send(client('X'), node('B'), null, function() {
                node('B')._value = '4';
                node('B')._currentSeqId = 2;
                node('B')._state = 'proposer';
                // Initiate Propose Round
                model().send(node('B'), node('A'), {type:'PROPOSE'}, function () {
                    node('A')._currentSeqId = 2;
                    node('A')._coordinatorId = 'B';
                    // Promise, finish phase 1
                    model().send(node('A'), node('B'), {type:'PROMISE'}, function () {
                        node('B')._state = 'coordinator';
                        // Accept, start phase 2
                        model().send(node('B'), node('A'), {type:'ACCEPT'}, function () {
                            node('A')._value = '4';
                            // Acknowledge, finish phase 2
                            model().send(node('A'), node('B'), {type:'ACKNOWLEDGE'});
                            layout.invalidate();
                        });
                        layout.invalidate();
                    });
                    layout.invalidate();
                });
                model().send(node('B'), node('C'), {type:'PROPOSE'}, function () {
                    node('C')._currentSeqId = 2;
                    node('C')._coordinatorId = 'B';
                    model().send(node('C'), node('B'), {type:'PROMISE'}, function () {
                        model().send(node('B'), node('C'), {type:'ACCEPT'}, function () {
                            node('C')._value = '4';
                            model().send(node('C'), node('B'), {type:'ACKNOWLEDGE'});
                            layout.invalidate();
                        });
                        layout.invalidate();
                    });
                    layout.invalidate();
                });
                layout.invalidate();
            });
            layout.invalidate();
        })
        .after(5000, function () {
            subtitle('<h2>Now what happens when an <em>Acceptor</em> fails in the next round?</h2>')
            layout.invalidate();
        })
        .after(100, function () {
            client('X').value('9')
            layout.invalidate();
        })
        .after(100, function () {
            frame.model().send(client('X'), node('B'), null, function() {
                node('B')._value = '9';
                node('B')._currentSeqId = 5;
                layout.invalidate();
            });
            layout.invalidate();
        })
        .after(1000, function () {
            model().send(node('B'), node('A'), {type:'PROPOSE'}, function () {
                node('A')._currentSeqId = 5;
            });
            model().send(node('B'), node('C'), {type:'PROPOSE'});
            layout.invalidate();
        })
        .after(400, function() {
            frame.snapshot();
            subtitle('<h2> Now an <em>Acceptor</em> becomes unresponsive.</h2>')
            layout.invalidate();
        })
        .after(100, function () {
            node('C')._state = 'stopped';
            layout.invalidate();
        })
        .after(1000, function () {
            model().send(node('A'), node('B'), {type:'PROMISE'}, function () {})
            layout.invalidate();
        })
        .after(100, function () {
            subtitle('<h2> The <em> Proposer </em> still receives a response from a majority of <em>Acceptors</em> so the round continues</h2>')
            layout.invalidate();
        })
        .after(1000, function () {
            model().send(node('B'), node('A'), {type:'ACCEPT'}, function () {
                node('A')._value = '9';
            });
            model().send(node('B'), node('C'), {type:'ACCEPT'})
            layout.invalidate();
        })
        .after(1000, function () {
            model().send(node('A'), node('B'), {type:'ACKNOWLEDGE'}); 
            layout.invalidate();
        })
        .after(1000, function () {
            subtitle('<h2>If the failed <em>Acceptor</em> recovers, it will learn the current <em>Coordinator</em> via a <em>Propose</em> message and the latest value via an <em>Accept</em> message.</h2>');
            layout.invalidate();
        })
        .after(300, function () {
            node('C')._state = 'replica';
            node('C')._coordinatorId = null;
            node('C')._currentSeqId = 0;
            layout.invalidate();
        })
        .after(200, function () {
            client('X')._value = '2';
            layout.invalidate();
        })
        .after(200, function () {
            frame.model().send(client('X'), node('B'), null, function() {
                node('B')._value = '2';
                node('B')._currentSeqId = 8;
                model().send(node('B'), node('A'), {type:'PROPOSE'}, function () {
                    node('A')._currentSeqId = 8;
                    model().send(node('A'), node('B'), {type:'PROMISE'}, function () {
                        model().send(node('B'), node('A'), {type:'ACCEPT'}, function () {
                            node('A')._value = '2';
                            model().send(node('A'), node('B'), {type:'ACKNOWLEDGE'});
                            layout.invalidate();
                        });
                        layout.invalidate();
                    });
                    layout.invalidate();
                });
                model().send(node('B'), node('C'), {type:'PROPOSE'}, function () {
                    node('C')._currentSeqId = 8;
                    node('C')._coordinatorId = 'B';
                    model().send(node('C'), node('B'), {type:'PROMISE'}, function () {
                        model().send(node('B'), node('C'), {type:'ACCEPT'}, function () {
                            node('C')._value = '2';
                            model().send(node('C'), node('B'), {type:'ACKNOWLEDGE'});
                            layout.invalidate();
                        });
                        layout.invalidate();
                    });
                    layout.invalidate();
                });
                layout.invalidate();
            });
            layout.invalidate();
        })
        .after(5000, function () {
            subtitle('<h2>But what happens when a proposer fails?</h2>')
        })

        //------------------------------
        // Failure of a Proposer
        //------------------------------
        .after(100, function() {
            model().clear();
            layout.invalidate();
        })
        .after(300, function () {
            model().nodes.create('A');
            model().nodes.create('B');
            model().nodes.create('C');
            model().nodes.create('D');
            model().clients.create('Y');
            
            cluster(['A', 'B', 'C', 'D']);
            layout.invalidate();
        })
        .after(100, function() {
            subtitle('<h2>Again, the system is up and running with a <span style="color:green">client</span> making requests</h2>'); 
            layout.invalidate();
        })
        .after(300, function () {
            client('Y').value('6')
            layout.invalidate();
        })
        .after(200, function () {
            frame.model().send(client('Y'), node('B'), null, function() {
                node('B')._value = '6';
                node('B')._currentSeqId = 2;
                node('B')._state = 'proposer';
                model().send(node('B'), node('A'), {type:'PROPOSE'}, function () {
                    node('A')._currentSeqId = 2;
                    node('A')._coordinatorId = 'B';
                    model().send(node('A'), node('B'), {type:'PROMISE'}, function () {
                        node('B')._state = 'coordinator';
                        model().send(node('B'), node('A'), {type:'ACCEPT'}, function() {
                            node('A')._value = '6';
                            model().send(node('A'), node('B'), {type:'ACKNOWLEDGE'});
                            layout.invalidate();
                        });
                        layout.invalidate();
                    });
                    layout.invalidate();
                });
                model().send(node('B'), node('C'), {type:'PROPOSE'}, function () {
                    node('C')._currentSeqId = 2;
                    node('C')._coordinatorId = 'B';
                    model().send(node('C'), node('B'), {type:'PROMISE'}, function () {
                        model().send(node('B'), node('C'), {type:'ACCEPT'}, function () {
                            node('C')._value = '6';
                            model().send(node('C'), node('B'), {type:'ACKNOWLEDGE'});
                            layout.invalidate();
                        });
                        layout.invalidate();
                    });
                    layout.invalidate();
                });
                model().send(node('B'), node('D'), {type:'PROPOSE'}, function () {
                    node('D')._currentSeqId = 2;
                    node('D')._coordinatorId = 'B';
                    model().send(node('D'), node('B'), {type:'PROMISE'}, function () {
                        model().send(node('B'), node('D'), {type:'ACCEPT'}, function () {
                            node('D')._value = '6';
                            model().send(node('D'), node('B'), {type:'ACKNOWLEDGE'});
                            layout.invalidate();
                        });
                        layout.invalidate();
                    });
                    layout.invalidate();
                });
                layout.invalidate();
            });
            layout.invalidate();
        })
        .after(5000, function () {
            subtitle('<h2>Now what happens when the proposer fails next round?</h2>');
            layout.invalidate();
        })
        .after(100, function () {
            client('Y').value('X'); 
            frame.model().send(client('Y'), node('B'), null, function() {
                node('B')._value = 'X';
                node('B')._currentSeqId = 5;
                model().send(node('B'), node('A'), {type:'PROPOSE'}, function () {
                    node('A')._currentSeqId = 5;
                    model().send(node('A'), node('B'), {type:'PROMISE'})
                    layout.invalidate();
                });
                model().send(node('B'), node('C'), {type:'PROPOSE'}, function () {
                    node('C')._currentSeqId = 5;
                    model().send(node('C'), node('B'), {type:'PROMISE'})
                    layout.invalidate();
                });
                model().send(node('B'), node('D'), {type:'PROPOSE'}, function () {
                    node('D')._currentSeqId = 5;
                    model().send(node('D'), node('B'), {type:'PROMISE'})
                    layout.invalidate();
                });
                layout.invalidate();
            });
            layout.invalidate();
        })
        .after(3300, function () {
            subtitle('<h2>The <em>Proposer</em> fails before broadcasting the Accept message</h2>');
            layout.invalidate();
        })
        .after(100, function () {
            node('B')._state = 'stopped';
            layout.invalidate();
        })
        .after(100, function () {
            frame.snapshot();
            subtitle('<h2>Now, it is important that the most recent promise made by the <em>Replicas</em> had a high Sequence ID</h2>');
            layout.invalidate();
        })
        .after(100, function () {
            subtitle('<h2>A new request is received with a lower Sequence ID, say, 3.</h2>');
            model().clients.create('Z');
            layout.invalidate();
        })
        .after(200, function () {
            model().send(client('Z'), node('C'), null, function () {
                node('C')._state = 'proposer';
                model().send(node('C'), node('A'), {type:'PROPOSE'}, function () {
                    model().send(node('A'), node('C'), {type: 'PROMISE'});
                });
                model().send(node('C'), node('D'), {type:'PROPOSE'}, function () {
                    model().send(node('D'), node('C'), {type: 'PROMISE'}, function () {
                        node('C')._state = 'coordinator';
                        node('C')._value = 'X';
                        layout.invalidate();
                    });
                    layout.invalidate();
                });
                layout.invalidate();
            });
            layout.invalidate();
        })
        .after(2500, function () {
            frame.snapshot()
            subtitle('<h2>The <em>Replicas</em> respond with the higher Sequence ID from the previous round, <em>5</em>, along with its related value, <em>X</em></h2>');
            layout.invalidate();
        })
        .after(1000, function () {
            subtitle('<h2>Now the new leader broadcasts the Accept message.</h2>');
            layout.invalidate();
        })
        .after(100, function () {
            model().send(node('C'), node('A'), {type:'ACCEPT'}, function () {
                node('A')._value = 'X';
                model().send(node('A'), node('C'), {type: 'ACKNOWLEDGE'});
                layout.invalidate();
            });
            model().send(node('C'), node('D'), {type:'ACCEPT'}, function () {
                node('D')._value = 'X';
                model().send(node('D'), node('C'), {type: 'ACKNOWLEDGE'});
                layout.invalidate();
            });
            layout.invalidate();
        })
        .after(3000, function () {
            subtitle('<h2> The new coordinator now returns a response to the <span style="color:green">clients</span> with their results.</h2>');
            layout.invalidate();
        })
        .after(100, function() {
            model().send(node('C'), client('Y'));
            model().send(node('C'), client('Z'));
            layout.invalidate();
        })
        .after(1500, function () {
            subtitle('<h2>The second client will be able to retry and get a better Sequence ID.</h2>');
            layout.invalidate();
        })


        //------------------------------
        // Dueling Proposers
        //------------------------------
        .after(100, function() {
            subtitle('<h2>The final error case is called Dueling Proposers, where two concurrent proposers are not able to complete a full round.</h2>');
            layout.invalidate();
        })
        .after(100, function () {
            model().clear();
            layout.invalidate();
        })
        .after(100, function () {
            model().nodes.create('A');
            model().nodes.create('B');
            model().nodes.create('C');
            model().nodes.create('D');
            model().clients.create('M');
            model().clients.create('N');
            
            cluster(['A', 'B', 'C', 'D']);
            layout.invalidate();
        })
        .after(100, function () {
            subtitle('<h2>The first client requests a value <em>M</em></h2>');
            layout.invalidate();
        })
        .after(100, function () {
            model().send(client('M'), node('A'), null, function () {
                node('A')._state = 'proposer';
                node('A')._currentSeqId = 20;
                node('A')._value = 'M';
                layout.invalidate();
            });
            layout.invalidate();
        })
        .after(1000, function () {
            subtitle('<h2>...but before this <em>proposer</em> sends out <em>Propose</em> messages, a second client contacts a second proposer, which completes the <em>Propose/Promise</em> exchange</h2>');
            layout.invalidate();
        })
        .after(100, function () {
            model().send(client('N'), node('D'), null, function () {
                node('D')._state = 'proposer';
                node('D')._currentSeqId = 30;
                node('D')._value = 'N';
                model().send(node('D'), node('B'), {type: 'PROPOSE'}, function () {
                    node('B')._currentSeqId = 30;
                    node('B')._value = 'N';
                    model().send(node('B'), node('D'), {type: 'PROMISE'});
                    layout.invalidate();
                });
                model().send(node('D'), node('C'), {type: 'PROPOSE'}, function () {
                    node('C')._currentSeqId = 30;
                    node('C')._value = 'N';
                    model().send(node('C'), node('D'), {type: 'PROMISE'});
                    layout.invalidate();
                });
                layout.invalidate();
            });
            layout.invalidate();
        })
        .after(3000, function () {
            subtitle('<h2>Bottom of Dueling Proposers</h2>');
            layout.invalidate();
        })


        //------------------------------
        // Candidacy
        //------------------------------
        .at(model(), "stateChange", function(event) {
            return (event.target.state() === "proposer");
        })
        .after(1, function () {
            subtitle('<h2>After the election timeout the follower becomes a candidate and starts a new <em>election term</em>...</h2>');
        })
        .after(1, function () {
            subtitle('<h2>...votes for itself...</h2>');
        })
        .after(model().defaultNetworkLatency * 0.25, function () {
            subtitle('<h2>...and sends out <em>Request Vote</em> messages to other nodes.</h2>');
        })
        .after(model().defaultNetworkLatency, function () {
            subtitle('<h2>If the receiving node hasn\'t voted yet in this term then it votes for the candidate...</h2>');
        })
        .after(1, function () {
            subtitle('<h2>...and the node resets its election timeout.</h2>');
        })


        //------------------------------
        // Leadership & heartbeat timeout.
        //------------------------------
        .at(model(), "stateChange", function(event) {
            return (event.target.state() === "coordinator");
        })
        .after(1, function () {
            subtitle('<h2>Once a candidate has a majority of votes it becomes leader.</h2>');
        })
        .after(model().defaultNetworkLatency * 0.25, function () {
            subtitle('<h2>The leader begins sending out <em>Append Entries</em> messages to its followers.</h2>');
        })
        .after(1, function () {
            subtitle('<h2>These messages are sent in intervals specified by the <span style="color:red">heartbeat timeout</span>.</h2>');
        })
        .after(model().defaultNetworkLatency, function () {
            subtitle('<h2>Followers then respond to each <em>Append Entries</em> message.</h2>');
        })
        .after(1, function () {
            subtitle('', false);
        })
        .after(model().heartbeatTimeout * 2, function () {
            subtitle('<h2>This election term will continue until a follower stops receiving heartbeats and becomes a candidate.</h2>', false);
        })
        .after(100, wait).indefinite()
        .after(1, function () {
            subtitle('', false);
        })

        //------------------------------
        // Leader re-election
        //------------------------------
        .after(model().heartbeatTimeout * 2, function () {
            subtitle('<h2>Let\'s stop the leader and watch a re-election happen.</h2>', false);
        })
        .after(100, wait).indefinite()
        .after(1, function () {
            subtitle('', false);
            model().coordinator().state("stopped")
        })
        .after(model().defaultNetworkLatency, function () {
            model().ensureSingleProposer()
        })
        .at(model(), "stateChange", function(event) {
            return (event.target.state() === "coordinator");
        })
        .after(1, function () {
            subtitle('<h2>Node ' + model().coordinator().id + ' is now leader of term ' + model().coordinator().currentTerm() + '.</h2>', false);
        })
        .after(1, wait).indefinite()

        //------------------------------
        // Split Vote
        //------------------------------
        .after(1, function () {
            subtitle('<h2>Requiring a majority of votes guarantees that only one leader can be elected per term.</h2>', false);
        })
        .after(1, wait).indefinite()
        .after(1, function () {
            subtitle('<h2>If two nodes become candidates at the same time then a split vote can occur.</h2>', false);
        })
        .after(1, wait).indefinite()
        .after(1, function () {
            subtitle('<h2>Let\'s take a look at a split vote example...</h2>', false);
        })
        .after(1, wait).indefinite()
        .after(1, function () {
            subtitle('', false);
            model().nodes.create("D").init().currentTerm(node("A").currentTerm());
            cluster(["A", "B", "C", "D"]);

            // Make sure two nodes become candidates at the same time.
            model().resetToNextTerm();
            var nodes = model().ensureSplitVote();

            // Increase latency to some nodes to ensure obvious split.
            model().latency(nodes[0].id, nodes[2].id, model().defaultNetworkLatency * 1.25);
            model().latency(nodes[1].id, nodes[3].id, model().defaultNetworkLatency * 1.25);
        })
        .at(model(), "stateChange", function(event) {
            return (event.target.state() === "proposer");
        })
        .after(model().defaultNetworkLatency * 0.25, function () {
            subtitle('<h2>Two nodes both start an election for the same term...</h2>');
        })
        .after(model().defaultNetworkLatency * 0.75, function () {
            subtitle('<h2>...and each reaches a single follower node before the other.</h2>');
        })
        .after(model().defaultNetworkLatency, function () {
            subtitle('<h2>Now each candidate has 2 votes and can receive no more for this term.</h2>');
        })
        .after(1, function () {
            subtitle('<h2>The nodes will wait for a new election and try again.</h2>', false);
        })
        .at(model(), "stateChange", function(event) {
            return (event.target.state() === "coordinator");
        })
        .after(1, function () {
            model().resetLatencies();
            subtitle('<h2>Node ' + model().coordinator().id + ' received a majority of votes in term ' + model().coordinator().currentTerm() + ' so it becomes leader.</h2>', false);
        })
        .after(1, wait).indefinite()

        .then(function() {
            player.next();
        })


        player.play();
    };
});
