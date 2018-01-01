
"use strict";
/*jslint browser: true, nomen: true*/
/*global define*/

define(["../model/log_entry"], function (LogEntry) {
    return function (frame) {
        var player = frame.player(),
            layout = frame.layout(),
            model = function() { return frame.model(); },
            client = function(id) { return frame.model().clients.find(id); },
            node = function(id) { return frame.model().nodes.find(id); },
            wait = function() { var self = this; model().controls.show(function() { player.play(); self.stop(); }); };

        frame.after(1, function() {
            model().nodeLabelVisible = false;
            model().clear();
            model().nodes.create("a");
            model().nodes.create("b");
            model().nodes.create("c");
            layout.invalidate();
        })

        .after(800, function () {
            model().subtitle = '<h2><em>Paxos</em> is a protocol for achieving distributed consensus.</h2>'
                           + model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(100, function () {
            frame.snapshot();
            model().subtitle = '<h2>Let\'s look at a high level overview of how it works.</h2>'
                           + model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(100, function () {
            frame.snapshot();
            model().zoom([node("b")]);
            model().subtitle = '<h2>A node can be in 1 of 3 states:</h2>'
                           + model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(100, function () {
            frame.snapshot();
            node("b")._state = "replica";
            model().subtitle = '<h2>The <em>Acceptor</em> state,</h2>'
                           + model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(100, function () {
            frame.snapshot();
            node("b")._state = "proposer";
            model().subtitle = '<h2>the <em>Proposer</em> state,</h2>'
                           + model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(100, function () {
            frame.snapshot();
            node("b")._state = "coordinator";
            model().subtitle = '<h2>or the <em>Coordinator</em> state.</h2>'
                           + model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(100, function () {
            frame.model().subtitle = '<h3>Every node keeps track of the highest <em>sequence ID</em> that it has seen.</h3>'
                           + frame.model().controls.html();
            model().zoom(null);
            node("b")._state = "replica";
            node("a")._log.push(new LogEntry(model(), 0, 1, "SEQ 0"));
            node("b")._log.push(new LogEntry(model(), 0, 1, "SEQ 0"));
            node("c")._log.push(new LogEntry(model(), 0, 1, "SEQ 0"));
            node("a").commitIndex(1);
            node("b").commitIndex(1);
            node("c").commitIndex(1);
            layout.invalidate();
        })
        .after(1, wait).indefinite()
        .after(300, function () {
            model().subtitle = '<h2>All our nodes, start in the acceptor state.</h2>'
                           + model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(100, function () {
            frame.snapshot();
            model().subtitle = '<h2>Paxos consensus is decided in a <em>round</em>, called a round of Paxos</h2>'
                           + model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(100, function () {
            frame.model().subtitle = '<h2>Each round of Paxos is broken into two phases: <em>Prepare</em>, and <em>Accept</em>.</h2>'
                           + frame.model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()

        //------------------------------
        // Prepare Phase
        //------------------------------
        .after(100, function() {
            model().clear();
            layout.invalidate();
        })
        .after(500, function () {
            frame.snapshot();
            frame.model().title = '<h2 style="visibility:visible"><em>Prepare</em> Phase</h1>'
                                + '<br/>' + frame.model().controls.html();
            layout.invalidate();
        })
        .after(200, wait).indefinite()
        .after(500, function () {
            model().title = "";
            layout.invalidate();
        })
        .after(300, function () {
            frame.model().subtitle = '<h2>A round of paxos starts when a <span style="color:green">client</span> sends a request to some replica.</h2>'
                           + frame.model().controls.html();
            model().nodes.create("a");
            model().nodes.create("b");
            model().nodes.create("c");
            node("a")._log.push(new LogEntry(model(), 0, 1, "SEQ 0"));
            node("b")._log.push(new LogEntry(model(), 0, 1, "SEQ 0"));
            node("c")._log.push(new LogEntry(model(), 0, 1, "SEQ 0"));
            node("a").commitIndex(1);
            node("b").commitIndex(1);
            node("c").commitIndex(1);
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(500, function () {
            frame.model().clients.create("X");
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(100, function () {
            frame.snapshot();
            frame.model().subtitle += "";
            client("X").value("8");
            layout.invalidate();
        })
        .after(200, function () {
            frame.model().send(client("X"), node("b"), null, function() {
                node("b")._value = "8";
                layout.invalidate();
            });
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(100, function () {
            frame.model().subtitle = '<h2>This node now becomes a <em>proposer</em> and picks a sequence ID, (2).</h2>'
                           + frame.model().controls.html();
            node("b")._log[0] = new LogEntry(model(), 1, 1, "SEQ 2");
            layout.invalidate();
        })
        .after(100, function () {
            node("b")._state = "proposer";
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(100, function () {
            frame.snapshot();
            model().subtitle = '<h2>The proposer sends a <em>propose</em> message to the other replicas with the value and sequence ID</h2>'
                           + model().controls.html();
            layout.invalidate();
        })
        .after(100, function () {
            model().send(node("b"), node("a"), {type:"PROPOSE"})
            model().send(node("b"), node("c"), {type:"PROPOSE"})
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(100, function () {
            frame.snapshot();
            model().subtitle = '<h2>Replicas respond with a <em>promise</em> message containing the largest sequence ID they know and its associated value</h2>'
                           + model().controls.html();
            layout.invalidate();
        })
        .after(300, function () {
            model().send(node("a"), node("b"), {type:"PROMISE"})
            model().send(node("c"), node("b"), {type:"PROMISE"})
            node("a")._log[0] = new LogEntry(model(), 1, 1, "SEQ 2");
            node("c")._log[0] = new LogEntry(model(), 1, 1, "SEQ 2");
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(100, function() {
            model().subtitle = '<h2>Replicas have now promised to reject any messages with lower sequence IDs.</h2>'
                        + model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(100, function () {
            model().subtitle = '<h2>The proposer has received enough promise messages and becomes a coordinator.</h2>'
                          + model().controls.html();
            node("b")._state = "coordinator";
            layout.invalidate();
        })
        .after(100, wait).indefinite()

        //------------------------------
        // Accept Phase
        //------------------------------
        .after(100, function() {
            model().clear();
            layout.invalidate();
        })
        .after(500, function () {
            frame.snapshot();
            frame.model().title = '<h2 style="visibility:visible"><em>Accept</em> Phase</h1>'
                                + '<br/>' + frame.model().controls.html();
            layout.invalidate();
        })
        .after(200, wait).indefinite()
        .after(500, function () {
            model().title = "";
            layout.invalidate();
        })
        .after(300, function () {
            frame.model().subtitle = '<h2>The coordinator now picks the message with the highest sequence ID from the prepare phase and broadcasts an <em>accept</em> message and its associated value.</h2>'
                            + frame.model().controls.html();
            model().nodes.create("a");
            model().nodes.create("b");
            model().nodes.create("c");
            node("a")._log.push(new LogEntry(model(), 1, 1, "SEQ 2"));
            node("b")._log.push(new LogEntry(model(), 1, 1, "SEQ 2"));
            node("c")._log.push(new LogEntry(model(), 1, 1, "SEQ 2"));
            node("a").commitIndex(1);
            node("b").commitIndex(1);
            node("c").commitIndex(1);
            model().clients.create("X");
            client("X").value("8");
            node("b")._value = "8";
            node("b")._state = "coordinator";
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(100, function () {
            frame.snapshot();
            model().subtitle = '<h2>Note that this new sequence ID and value pair are not neccessarily the same from the prepare stage.</h2>'
                           + model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(300, function () {
            frame.snapshot();
            model().send(node("b"), node("a"), {type:"ACCEPT"}, function () {
                //node("a")._log.push(new LogEntry(model(), 2, 1, "SET 8"));
                node("a")._value = "8";
                layout.invalidate();
            });
            model().send(node("b"), node("c"), {type:"ACCEPT"}, function () {
                //node("c")._log.push(new LogEntry(model(), 2, 1, "SET 8"));
                node("c")._value = "8";
                layout.invalidate();
            });
            model().subtitle = '<h2>Replicas can either <em>acknowledge</em> or <em>reject</em> the new value.</h2>'
                           + model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(100, function () {
            frame.snapshot();
            model().subtitle = '<h2>Replicas will accept the new value if and only if they have not responded to a <em>promise</em> message containing a greater sequence ID.</h2>'
                           + model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(100, function () {
            frame.snapshot();
            model().send(node("a"), node("b"), {type:"ACKNOWLEDGE"}, function () {
                node("b")._commitIndex = 1;
                node("b")._value = "8";
                layout.invalidate();
            });
            model().send(node("c"), node("b"), {type:"ACKNOWLEDGE"});
            model().subtitle = '<h2>then the coordinator waits until a majority of replicas have acknowledged.</h2>'
                           + model().controls.html();
            layout.invalidate();
        })
        .after(1000, function () {
            node("b")._commitIndex = 2;
            node("b")._value = "8";
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(100, function () {
            frame.snapshot();
            model().subtitle = '<h2>The entry is now committed on the leader node and the node state is "8".</h2>'
                           + model().controls.html();
            node("b")._commitIndex = 2;
            layout.invalidate();
        })
        .after(100, wait).indefinite()

        //------------------------------
        // Conclusion
        //------------------------------
        .after(100, function () {
            frame.snapshot();
            model().subtitle = '<h2>The cluster has now come to consensus about the system state.</h2>'
                           + model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(300, function () {
            frame.snapshot();
            model().subtitle = '<h2>Future changes to the system will generally pass through the <em>coordinator</em> node, for reasons we will see.</h2>'
                           + model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(300, function () {
            frame.snapshot();
            model().subtitle = '<h2>This two-phase process forms the bases of the Paxos protocol.</h2>'
                           + model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(300, function () {
            frame.snapshot();
            player.next();
        })
        player.play();
    };
});
