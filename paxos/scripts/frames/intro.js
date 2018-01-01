
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
            wait = function() { var self = this; model().controls.show(function() { self.stop(); }); };

        frame.after(1, function() {
            model().nodeLabelVisible = false;
            frame.snapshot();
            frame.model().clear();
            layout.invalidate();
        })

        .after(1000, function () {
            frame.model().title = '<h3>The distributed consensus problem requires a collection of processes to agree upon a value or state. These processes are crash-prone and may fail and optionally restart. In addition, processes can only communicate via messages over an imperfect network, with arbitrary latencies and dropped packets.</h3>' + frame.model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(10, function () {
            frame.model().title = '<h3>Distributing a system, that is, having multiple (typically geographically distributed) nodes, is often neccessary for high performance or fault tolerant applications.</h3>' + frame.model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(10, function () {
            frame.model().title = '<h3>Consensus is important because it provides the underlying facilities for distributed databases and logs, such as Google\'s `Chubby` distributed lock.</h3>' + frame.model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(10, function () {
            frame.model().title = '<h3>This problem is difficult because as processes crash or fail to communicate, the system must still achieve data integreity guarantees, like not getting out of sync (i.e. the system "agrees" on two separate values), or losing data.</h3>' + frame.model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()

        .after(1000, function () {
            frame.model().title = '<h2 style="visibility:visible">So What is Distributed Consensus?</h2>'
                        + '<h3 style="visibility:hidden;">Let\'s start with an example...</h3>'
                        + '<br/>' + frame.model().controls.html();
            layout.invalidate();
        })
        .after(1000, function () {
            layout.fadeIn($(".title h3"));
        })
        .after(1000, function () {
            frame.model().controls.show();
        })
        .after(50, function () {
            frame.model().title = frame.model().subtitle = "";
            layout.invalidate();
        })


        .after(800, function () {
            frame.snapshot();
            frame.model().subtitle = '<h2>Let\'s say we have a single node system</h2>'
                           + frame.model().controls.html();
            layout.invalidate();
        })
        .after(500, function () {
            frame.model().nodes.create("a");
            layout.invalidate();
        })
        .after(100, wait).indefinite()

        .after(100, function () {
            frame.snapshot();
            frame.model().subtitle = "";
            frame.model().zoom([node("a")]);
            layout.invalidate();
        })
        .after(600, function () {
            frame.model().subtitle = '<h2>For this example, you can think of our <span style="color:steelblue">node</span> as a database server that stores a single value.</h2>'
                           + frame.model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(100, function () {
            frame.snapshot();
            node("a")._value = "x";
            layout.invalidate();
        })
        .after(100, wait).indefinite()

        .after(100, function () {
            frame.snapshot();
            frame.model().subtitle = "";
            frame.model().zoom(null);
            layout.invalidate();
        })
        .after(1000, function () {
            frame.model().subtitle = '<h2>We also have a <span style="color:green">client</span> that can send a value to the server.</h2>'
                           + frame.model().controls.html();
            layout.invalidate();
        })
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
            frame.model().send(client("X"), node("a"), null, function() {
                node("a")._value = "8";
                layout.invalidate();
            });
            layout.invalidate();
        })
        .after(100, wait).indefinite()
        .after(100, function () {
            frame.model().subtitle = '<h2>Coming to agreement, or <em>consensus</em>, on that value is easy with one node.</h2>'
                           + frame.model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()


        .after(100, function () {
            frame.snapshot();
            frame.model().subtitle = '<h2>But how do we come to consensus if we have multiple nodes?</h2>'
                           + frame.model().controls.html();
            layout.invalidate();
        })
        .after(500, function () {
            frame.model().nodes.create("b");
            layout.invalidate();
        })
        .after(500, function () {
            frame.model().nodes.create("c");
            layout.invalidate();
        })
        .after(100, wait).indefinite()


        .after(100, function () {
            frame.snapshot();
            frame.model().subtitle = '<h2>That\'s the problem of <em>distributed consensus</em>.</h2>'
                           + frame.model().controls.html();
            layout.invalidate();
        })
        .after(100, wait).indefinite()

        .after(300, function () {
            frame.snapshot();
            player.next();
        })


        frame.addEventListener("end", function () {
            frame.model().title = frame.model().subtitle = "";
            layout.invalidate();
        });

        player.play();
    };
});
