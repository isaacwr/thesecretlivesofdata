
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
        frame.after(0, function() {
            model().clear();
            layout.invalidate();
        })
        .after(500, function () {
            frame.snapshot();
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
            frame.snapshot();
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
        .after(500, function() {
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
            frame.snapshot();
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
            subtitle('<h2>Now, it is important that the most recent promise made by the <em>Acceptors</em> had a high Sequence ID</h2>');
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
            subtitle('<h2>Now the new leader broadcasts the <em>Accept</em> message.</h2>');
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
            subtitle('<h2>The new coordinator now returns a response to the <span style="color:green">clients</span> with their results.</h2>');
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
        .after(100, function () {
            model().clear();
            layout.invalidate();
        })
        .after(100, function() {
            frame.snapshot();
            subtitle('<h2>The final error case is called Dueling Proposers, where two concurrent proposers are not able to complete a full round.</h2>');
        })
        .after(100, function () {
            model().nodes.create('A');
            model().nodes.create('B');
            model().nodes.create('C');
            model().nodes.create('D');
            model().nodes.create('E');
            model().clients.create('M');
            
            cluster(['A', 'B', 'C', 'D', 'E']);
            layout.invalidate();
        })
        .after(100, function () {
            subtitle('<h2>A <span style="color:green">client</span> makes a request, so a proposer is chosen and broadcasts with Sequence ID 1</h2>');
        })
        .after(100, function () {
            model().send(client('M'), node('C'), null, function () {
                node('C')._state = 'proposer';
                node('C')._currentSeqId = 1;
                model().send(node('C'), node('A'), {type: 'PROPOSE'}, function () {
                    node('A')._currentSeqId = 1;
                    model().send(node('A'), node('C'), {type: 'PROMISE'});
                    layout.invalidate();
                });
                model().send(node('C'), node('B'), {type: 'PROPOSE'}, function () {
                    node('B')._currentSeqId = 1;
                    model().send(node('B'), node('C'), {type: 'PROMISE'});
                    layout.invalidate();
                });
                model().send(node('C'), node('D'), {type: 'PROPOSE'}, function () {
                    node('D')._currentSeqId = 1;
                    model().send(node('D'), node('C'), {type: 'PROMISE'});
                    layout.invalidate();
                });
                model().send(node('C'), node('E'), {type: 'PROPOSE'}, function () {
                    node('E')._currentSeqId = 1;
                    model().send(node('E'), node('C'), {type: 'PROMISE'});
                    layout.invalidate();
                });
                layout.invalidate();
            });
            layout.invalidate();
        })
        .after(3300, function () {
            subtitle('<h2>...but before this <em>proposer</em> sends out <em>Accept</em> messages, it fails</h2>');
        })
        .after(100, function () {
            node('C')._state = 'stopped';
            layout.invalidate();
        })
        .after(100, function () {
            subtitle('<h2>Now a second replica tries to initiate a round using a higher Sequence ID, 2</h2>');
        })
        .after(100, function () {
            node('A')._state = 'proposer';
            node('A')._currentSeqId = 2;
            model().send(node('A'), node('B'), {type: 'PROPOSE'}, function () {
                node('B')._currentSeqId = 2;
                model().send(node('B'), node('A'), {type: 'PROMISE'});
                layout.invalidate();
            });
            model().send(node('A'), node('D'), {type: 'PROPOSE'}, function () {
                node('D')._currentSeqId = 2;
                model().send(node('D'), node('A'), {type: 'PROMISE'});
                layout.invalidate();
            });
            model().send(node('A'), node('E'), {type: 'PROPOSE'}, function () {
                node('E')._currentSeqId = 2;
                model().send(node('E'), node('A'), {type: 'PROMISE'});
                layout.invalidate();
            });
            layout.invalidate();
        })
        .after(5000, function () {
            subtitle('<h2>Now the original proposer recovers!</h2');
        })
        .after(100, function () {
            node('C')._state = 'replica';
            layout.invalidate();
        })
        .after(100, function () {
            subtitle('<h2>...and tries to initiate a round with Sequence ID 2</h2>');
        })
        .after(100, function () {
            node('C')._state = 'proposer';
            node('C')._currentSeqId = 2;
            model().send(node('C'), node('B'), {type: 'PROPOSE'});
            model().send(node('C'), node('D'), {type: 'PROPOSE'});
            model().send(node('C'), node('E'), {type: 'PROPOSE'});
            layout.invalidate();
        })
        .after(2000, function () {
            subtitle('<h2>These replicase reject this proposal...</h2>');
        })
        .after(100, function () {
            model().send(node('B'), node('C'), {type: 'PROMISE'});
            model().send(node('D'), node('C'), {type: 'PROMISE'});
            model().send(node('E'), node('C'), {type: 'PROMISE'});
            layout.invalidate();
        })
        .after(2000, function () {
            subtitle('<h2>...so the original proposer increases its Sequence ID to 3 and tries again.</h2>');
        })
        .after(100, function () {
            node('C')._currentSeqId = 3;
            model().send(node('C'), node('B'), {type: 'PROPOSE'}, function () {
                node('B')._currentSeqId = 3;
                model().send(node('B'), node('C'), {type: 'PROMISE'});
                layout.invalidate();
            });
            model().send(node('C'), node('D'), {type: 'PROPOSE'}, function () {
                node('D')._currentSeqId = 3;
                model().send(node('D'), node('C'), {type: 'PROMISE'});
                layout.invalidate();
            });
            model().send(node('C'), node('E'), {type: 'PROPOSE'}, function () {
                node('E')._currentSeqId = 3;
                model().send(node('E'), node('C'), {type: 'PROMISE'});
                layout.invalidate();
            });
            layout.invalidate();
        })
        .after(3000, function () {
            subtitle('<h2>The replicas make a promise to the old leader.</h2>');
        })
        .after(100, function () {
            subtitle('<h2>The new leader now tries to commit its value, using Sequence ID 2...</h2>');
        })
        .after(100, function () {
            model().send(node('A'), node('B'), {type: 'ACCEPT'});
            model().send(node('A'), node('D'), {type: 'ACCEPT'});
            model().send(node('A'), node('E'), {type: 'ACCEPT'});
            layout.invalidate();
        })
        .after(2000, function () {
            subtitle('<h2>...but the replicas reject it because they have since promised on a higher Sequence ID.</h2>');
        })
        .after(100, function () {
            model().send(node('B'), node('A'), {type: 'ACKNOWLEDGE'});
            model().send(node('D'), node('A'), {type: 'ACKNOWLEDGE'});
            model().send(node('E'), node('A'), {type: 'ACKNOWLEDGE'});
            layout.invalidate();
        })
        .after(2000, function () {
            subtitle('<h2>The new leader now increases its Sequence ID to 4 and initiates a new round</h2>');
        })
        .after(100, function () {
            node('A')._currentSeqId = 4;
            model().send(node('A'), node('B'), {type: 'PROPOSE'}, function () {
                node('B')._currentSeqId = 4;
                model().send(node('B'), node('A'), {type: 'PROMISE'});
                layout.invalidate();
            });
            model().send(node('A'), node('D'), {type: 'PROPOSE'}, function () {
                node('D')._currentSeqId = 4;
                model().send(node('D'), node('A'), {type: 'PROMISE'});
                layout.invalidate();
            });
            model().send(node('A'), node('E'), {type: 'PROPOSE'}, function () {
                node('E')._currentSeqId = 4;
                model().send(node('E'), node('A'), {type: 'PROMISE'});
                layout.invalidate();
            });
            layout.invalidate();
        })
        .after(3000, function () {
            subtitle('<h2>The replicas have now promised Sequence ID 4</h2>');
        })
        .after(100, function () {
            subtitle('<h2>The old leader now tries to commit its value using Sequence ID 3...</h2>');
        })
        .after(100, function () {
            model().send(node('C'), node('B'), {type: 'ACCEPT'});
            model().send(node('C'), node('D'), {type: 'ACCEPT'});
            model().send(node('C'), node('E'), {type: 'ACCEPT'});
            layout.invalidate();
        })
        .after(2000, function () {
            subtitle('<h2>...but the replicas reject it because they have since promised on a higher Sequence ID.</h2>');
        })
        .after(100, function () {
            model().send(node('B'), node('C'), {type: 'ACKNOWLEDGE'});
            model().send(node('D'), node('C'), {type: 'ACKNOWLEDGE'});
            model().send(node('E'), node('C'), {type: 'ACKNOWLEDGE'});
            layout.invalidate();
        })
        .after(2000, function () {
            subtitle('<h2>The old leader can now pick a higher Sequence ID...</h2>');
        })
        .after(100, function () {
            subtitle('<h2>...which means we are stuck in a cycle, where neither proposer can complete a successful round.</h2>');
        })
        .after(100, wait).indefinite()


        .then(function() {
            player.next();
        })


        player.play();
    };
});
