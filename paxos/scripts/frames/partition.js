
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
            subtitle = function(s, pause) { model().subtitle = s + model().controls.html(); layout.invalidate(); if (pause === undefined) { model().controls.show() }; },
            clear = function() { subtitle('', false); },
            removeAllNodes = function() { model().nodes.toArray().forEach(function(node) { node.state("stopped"); }); model().nodes.removeAll(); };

        //------------------------------
        // Title
        //------------------------------
        frame.after(0, function() {
            model().clear();
            layout.invalidate();
        })
        .after(500, function () {
            frame.model().title = '<h2 style="visibility:visible">Partition Tolerance</h1>'
                                + '<br/>' + frame.model().controls.html();
            layout.invalidate();
        })
        .after(200, wait).indefinite()
        .after(500, function () {
            model().title = "";
            layout.invalidate();
        })

        //------------------------------
        // Network Partition
        //------------------------------
        .after(1, function () {
            model().nodes.create('A');
            model().nodes.create('B');
            model().nodes.create('C');
            model().nodes.create('D');
            model().nodes.create('E');
            model().clients.create('Y');
            layout.invalidate();
        })
        .after(100, function () {
            frame.snapshot();
            subtitle('<h2>Paxos can stay consistent in the face of network partitions.</h2>');
        })
        .after(100, function () {
            subtitle('<h2>Let\'s add a partition to separate A & B from C, D & E.</h2>');
        })
        .after(1, function () {
            model().latency("A", "C", 0).latency("A", "D", 0).latency("A", "E", 0);
            model().latency("B", "C", 0).latency("B", "D", 0).latency("B", "E", 0);
        })
        .after(model().defaultNetworkLatency * 0.5, function () {
            var p = model().partitions.create("-");
            p.x1 = Math.min.apply(null, model().nodes.toArray().map(function(node) { return node.x;}));
            p.x2 = Math.max.apply(null, model().nodes.toArray().map(function(node) { return node.x;}));
            p.y1 = p.y2 = Math.round(node("B").y + node("C").y) / 2;
            layout.invalidate();
        })
        .after(100, function () {
            subtitle('<h2>Because of our partition we can now have the risk of inconsistent reads and updates.</h2>');
        })
        .after(100, function () {
            subtitle('<h2>Let the <span style="color:green">client</span> try to update both clusters.</h2>');
        })
        .after(100, function () {
            subtitle('<h2>The client will try to set the value of Node B to "3".</h2>');
            frame.model().send(client('Y'), node('B'), null, function() {
                node('B')._value = '3';
                node('B')._currentSeqId = 2;
                node('B')._state = 'proposer';
                layout.invalidate();
            });
        })
        .after(1000, function () {
            frame.snapshot();
            subtitle('<h2>Node B now tries to complete a round of paxos.</h2>');
        })
        .after(100, function () {
            model().send(node('B'), node('A'), {type:'PROPOSE'}, function () {
                node('A')._currentSeqId = 2;
                node('A')._coordinatorId = 'B';
                model().send(node('A'), node('B'), {type:'PROMISE'});
                layout.invalidate();
            });
        })
        .after(2500, function () {
            subtitle('<h2>Node B is not able to access a majority of <em>Acceptors</em>, and so is not able to continue this round.</h2>');
            layout.invalidate();
        })
        .after(250, function () {
            node('B')._state = 'replica';
            node('B')._value = '';
            layout.invalidate();
        })
        .after(250, function () {
            subtitle('<h2>Now the <span stype="color:green">client</span> tries to set the value of Node C to "5".</h2>');
            layout.invalidate();
        })
        .after(100, function () {
            frame.model().send(client('Y'), node('C'), null, function() {
                node('C')._value = '5';
                node('C')._currentSeqId = 7;
                node('C')._state = 'proposer';
                layout.invalidate();
            });
            layout.invalidate();
        })
        .after(1000, function () {
            frame.snapshot();
            subtitle('<h2>Node C initiates a round of Paxos...</h2>');
            layout.invalidate();
        })
        .after(100, function () {
            model().send(node('C'), node('D'), {type:'PROPOSE'}, function () {
                node('D')._currentSeqId = 7;
                node('D')._coordinatorId = 'C';
                model().send(node('D'), node('C'), {type:'PROMISE'});
                layout.invalidate();
            });
            model().send(node('C'), node('E'), {type:'PROPOSE'}, function () {
                node('E')._currentSeqId = 7;
                node('E')._coordinatorId = 'C';
                model().send(node('E'), node('C'), {type:'PROMISE'}, function () {
                    node('C').state('coordinator');
                    layout.invalidate();
                });
                layout.invalidate();
            });
            layout.invalidate();
        })
        .after(2500, function () {
            subtitle('<h2>Node C is able to reach a majority of <em>Acceptors</em> and is elected coordinator.</h2>');
            layout.invalidate();
        })
        .after(100, function () {
            subtitle('<h2>...so this round continues.</h2>');
            layout.invalidate();
        })
        .after(100, function () {
            model().send(node('C'), node('D'), {type:'ACCEPT'}, function () {
                node('D')._value = '5';
                model().send(node('D'), node('C'), {type:'ACKNOWLEDGE'});
                layout.invalidate();
            });
            model().send(node('C'), node('E'), {type:'ACCEPT'}, function () {
                node('E')._value = '5';
                model().send(node('E'), node('C'), {type:'ACKNOWLEDGE'});
                layout.invalidate();
            });
            layout.invalidate();
        }) 
        .after(100, wait).indefinite()
        .after(100, function () {
            frame.snapshot();
            subtitle('<h2>Now let\'s heal the network partition.</h2>');
        })
        .after(100, function () {
            model().partitions.removeAll();
            layout.invalidate();
        })
        .after(1, function () {
            model().latency("A", "C", 750).latency("A", "D", 750).latency("A", "E", 750);
            model().latency("B", "C", 750).latency("B", "D", 750).latency("B", "E", 750);
        })
        .after(100, function () {
            subtitle('<h2>A & B will learn about the successful rounds from the other side via a future <em>Propose</em> message.</h2>');
        })
        .after(100, function () {
            model().send(node('C'), node('A'), {type: 'PROPOSE'}, function () {
                node('A')._value = '5';
                node('A')._currentSeqId = 7;
                node('A')._coordinatorId = 'C';
                model().send(node('A'), node('C'), {type: 'PROMISE'});
                layout.invalidate();
            });
            model().send(node('C'), node('B'), {type: 'PROPOSE'}, function () {
                node('B')._value = '5';
                node('B')._currentSeqId = 7;
                node('B')._coordinatorId = 'C';
                model().send(node('B'), node('C'), {type: 'PROMISE'});
                layout.invalidate();
            });
            layout.invalidate();
        })
        .after(2500, function () {
            subtitle('<h2>Both Nodes A & B will match the new leader\'s state.</h2>');
        })

        .then(function() {
            player.next();
        })

        player.play();
    };
});
