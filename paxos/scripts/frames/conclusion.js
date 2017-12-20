
"use strict";
/*jslint browser: true, nomen: true*/
/*global define*/

define([], function () {
    return function (frame) {
        var player = frame.player(),
            layout = frame.layout();

        frame.after(1, function() {
            frame.model().clear();
            layout.invalidate();
        })

        .after(500, function () {
            frame.model().title = '<h1 style="visibility:visible">The End</h1>'
                        + '<br/>' + frame.model().controls.html();
            layout.invalidate();
        })
        .after(500, function () {
            frame.model().controls.show();
        })

        .after(500, function () {
            frame.model().title = '<h2 style="visibility:visible">For more information:</h2>'
                        + '<h3 style="visibility:visible"><a href="https://lamport.azurewebsites.net/pubs/lamport-paxos.pdf">The Original Paxos Paper</a></h3>'
                        + '<h3 style="visibility:visible"><a href="https://lamport.azurewebsites.net/pubs/paxos-simple.pdf">Simple Paxos Paper</a></h3>'
                        + '<h3 style="visibility:visible"><a href="https://research.google.com/archive/paxos_made_live.html">Paxos Made Live (Google)</a></h3>'
                        + '<br/>' + frame.model().controls.html();
            layout.invalidate();
        })
        
        player.play();
    };
});
