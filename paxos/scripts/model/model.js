
"use strict";
/*jslint browser: true, nomen: true*/
/*global define, playback, tsld*/

define(["./controls", "./client", "./message", "./node", "./partition"], function (Controls, Client, Message, Node, Partition) {
    function Model() {
        playback.Model.call(this);

        this.title = "";
        this.subtitle = "";
        this.defaultNetworkLatency = Model.DEFAULT_NETWORK_LATENCY;
        this.heartbeatTimeout = Model.DEFAULT_HEARTBEAT_TIMEOUT;
        this.electionTimeout = Model.DEFAULT_ELECTION_TIMEOUT;
        this.controls = new Controls(this);
        this.nodes = new playback.Set(this, Node);
        this.clients = new playback.Set(this, Client);
        this.messages = new playback.Set(this, Message);
        this.partitions = new playback.Set(this, Partition);
        this.nodeLabelVisible = true;
        this.latencies = {};
        this.bbox = tsld.bbox(0, 100, 100, 0);
        this.domains = {
            x: [0, 100],
            y: [0, 100],
        };
    }

    Model.prototype = new playback.Model();
    Model.prototype.constructor = Model;

    /**
     * The ratio of simulation time to wall clock time.
     */
    Model.SIMULATION_RATE           = (1/50);

    /**
     * The default network latency between two nodes if not set.
     */
    Model.DEFAULT_NETWORK_LATENCY   = 20 / Model.SIMULATION_RATE;

    /**
     * The default heartbeat timeout for the model.
     */
    Model.DEFAULT_HEARTBEAT_TIMEOUT = 50 / Model.SIMULATION_RATE;

    /**
     * The default election timeout for the model.
     */
    Model.DEFAULT_ELECTION_TIMEOUT  = 150 / Model.SIMULATION_RATE;


    /**
     * Finds either a node or client by id.
     */
    Model.prototype.find = function (id) {
        var ret = null;
        if (ret === null) {
            ret = this.nodes.find(id);
        }
        if (ret === null) {
            ret = this.clients.find(id);
        }
        return ret;
    };

    /**
     * Performs clean up of the model at time t.
     */
    Model.prototype.tick = function (t) {
        // Remove messages that have already been received.
        this.messages.filter(function(message) {
            return (message.recvTime > t);
        });
    };

    /**
     * Sends a message between two nodes if latency is greater than zero.
     *
     * @return {Message}
     */
    Model.prototype.send = function (source, target, payload, callback) {
        var message,
            source = (typeof(source) == "string" ? source : source.id),
            target = (typeof(target) == "string" ? target : target.id),
            latency = this.latency(source, target);

        if (!(latency > 0)) {
            return null;
        }

        message = this.messages.create();
        message.payload  = (payload !== undefined ? payload : null);
        message.source   = source;
        message.target   = target;
        message.sendTime = this.playhead();
        message.recvTime = message.sendTime + latency;

        if (callback !== undefined && callback !== null) {
            this.frame().after(latency, callback);
        }

        return message;
    };

    /**
     * Zooms in on a given node or zooms out to full screen.
     *
     * @param {Array}
     */
    Model.prototype.zoom = function (nodes) {
        var i, node,
            bbox = null;

        // Passing in a null node clears the zoom.
        if (nodes === null || nodes === undefined || nodes.length === 0) {
            bbox = tsld.bbox(0, 100, 100, 0);
        } else {
            // Find the x and y ranges to constrain the zoom bbox.
            bbox = nodes[0].bbox();
            for (i = 1; i < nodes.length; i += 1) {
                bbox = bbox.union(nodes[i].bbox());
            }
        }

        this.bbox = bbox;
        this.domains.x = [bbox.left, bbox.right];
        this.domains.y = [bbox.top, bbox.bottom];
    };

    /**
     * Removes all data from the model.
     */
    Model.prototype.clear = function () {
        this.title = this.subtitle = "";
        this.nodes.removeAll();
        this.clients.removeAll();
        this.messages.removeAll();
        this.latencies = {};
    };

    /**
     * Retrieves the latency between two node ids.
     */
    Model.prototype.latency = function (a, b, latency) {
        var ret,
            x = (a < b ? a : b),
            y = (a < b ? b : a),
            key = [x, y].join("|");
        if (arguments.length === 2) {
            ret = this.latencies[key];
            return (ret !== undefined ? ret : this.defaultNetworkLatency);
        }
        this.latencies[key] = latency;
        return this;
    };

    /**
     * Returns the current coordinator.
     */
    Model.prototype.coordinator = function (within) {
        return this.nodes.toArray().filter(function (node) {
            if (within === undefined || within === null || within.indexOf(node.id) !== -1) {
                return node.state() === "coordinator";
            }
        }).shift();
    };

    /**
     * Returns the current proposers.
     */
    Model.prototype.proposers = function () {
        return this.nodes.toArray().filter(function (node) {
            return node.state() === "proposer";
        });
    };

    /**
     * Updates the election timers to ensure that only one will become proposer.
     */
    Model.prototype.ensureSingleProposer = function () {
        var self = this,
            minTime = null,
            proposerId = null,
            nodes = this.nodes.toArray().filter(function (node) { return node.electionTimer() !== null; });

        // Find earliest proposer.
        nodes.forEach(function (node) {
            var startTime = node.electionTimer().startTime();
            if (minTime === null || startTime < minTime) {
                minTime = startTime;
                proposerId = node.id;
            }
        });

        // Extend other proposer timers.
        nodes.forEach(function (node) {
            var minStartTime = minTime + self.defaultNetworkLatency * 1.25,
                startTime = node.electionTimer().startTime();
            if (node.id !== proposerId && startTime < minStartTime) {
                node.electionTimer().startTime(minStartTime);
            }
        });        

        return proposerId;
    };

    /**
     * Updates the election timers to ensure that a specific node will become proposer.
     */
    Model.prototype.ensureExactProposer = function (proposerId) {
        var self = this,
            nodes = this.nodes.toArray().filter(function (node) { return node.id != proposerId && node.electionTimer() !== null; }),
            minTime = this.nodes.find(proposerId).electionTimer().startTime();

        // Extend other proposer timers.
        nodes.forEach(function (node) {
            var minStartTime = minTime + (self.defaultNetworkLatency * 1.25);
            node.electionTimer().startTime(minStartTime);
        });        
    };

    /**
     * Updates the election timers to ensure that two nodes will become proposers at the same time.
     */
    Model.prototype.ensureSplitVote = function () {
        var electionTime, nodes = this.nodes.toArray();
        nodes = nodes.filter(function (node) { return node.electionTimer() !== null; });
        nodes = nodes.sort(function (a, b) { return a.electionTimer().startTime() - b.electionTimer().startTime(); })

        // Set two nodes to become proposers at the same time.
        electionTime = nodes[0].electionTimer().startTime();
        nodes[1].electionTimer().startTime(electionTime);

        // Reset the rest to elect after at least the default network latency.
        nodes.slice(2).forEach(function (node) {
            if (node.electionTimer().startTime() < electionTime + self.defaultNetworkLatency) {
                node.electionTimer().delay(self.defaultNetworkLatency);
            }
        });

        return nodes;
    };

    /**
     * Forces a coordinator to be elected immediately.
     */
    Model.prototype.forceImmediateCoordinator = function () {
        var nodes  = this.nodes.toArray(),
            coordinator = nodes[Math.floor(Math.random()*nodes.length)],
            replicas = nodes.filter(function (node) { return node !== coordinator; });
        this.resetToNextSeqId();
        replicas.forEach(function (node) {
            node._coordinatorId = coordinator.id;
            node.state("replica");
        })
        coordinator.state("coordinator");
    };

    /**
     * Move all nodes to the next seqid so they all reset to replicas.
     */
    Model.prototype.resetToNextSeqId = function () {
        var maxSeqId = 0;
        this.nodes.toArray().forEach(function (node) { maxSeqId = Math.max(maxSeqId, node.currentSeqId()); });
        this.nodes.toArray().forEach(function (node) { node.currentSeqId(maxSeqId + 1); });
    };

    /**
     * Resets all latencies to the default.
     */
    Model.prototype.resetLatencies = function () {
        this.latencies = {};
    };

    /**
     * Clones the model.
     */
    Model.prototype.clone = function () {
        var i, key, clone = new Model();
        clone._player = this._player;
        clone.title = this.title;
        clone.subtitle = this.subtitle;
        clone.nodes = this.nodes.clone(clone);
        clone.clients = this.clients.clone(clone);
        clone.messages = this.messages.clone(clone);
        clone.bbox = this.bbox;
        clone.domains = {
            x: this.domains.x,
            y: this.domains.y,
        };
        for(key in this.latencies) {
            clone.latencies[key] = this.latencies[key];
        }
        return clone;
    };

    return Model;
});
