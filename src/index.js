"use strict";

const WebSocket = require("ws");
const EventEmitter = require("events");
const Emittery = require("emittery");

class ConsumerServer {
  constructor(opts) {
    if (!opts.port) {
      throw Error("port not defined");
    }

    this.wsPort = opts.port;

    this.wsHost = "0.0.0.0";
    if (opts.host) {
      this.wsHost = opts.host;
    }

    this.ackEvery = 100;
    if (opts.ackEvery) {
      this.ackEvery = opts.ackEvery;
    }

    this.interactive = false;
    if (opts.interactive) {
      this.interactive = true;
    }

    this.async = !!opts.async;
    this.emitter = new Emittery();

    if (!opts.blockHandler) {
      throw Error("block handler not defined");
    }
    this.blockHandler = opts.blockHandler;

    this.pendingAcks = []; // unused for sync case
    this.typemap = new Map();
    this.typemap.set(1001, "fork");
    this.typemap.set(1002, "block");
    this.typemap.set(1003, "tx");
    this.typemap.set(1004, "abi");
    this.typemap.set(1005, "abiRemoved");
    this.typemap.set(1006, "abiError");
    this.typemap.set(1007, "tableRow");
    this.typemap.set(1008, "encoderError");
    this.typemap.set(1009, "pause");
    this.typemap.set(1010, "blockCompleted");
    this.typemap.set(1011, "permission");
    this.typemap.set(1012, "permissionLink");
    this.typemap.set(1013, "accMetadata");

    this.confirmed_block = 0;
    this.unconfirmed_block = 0;
  }

  start() {
    console.log(
      "Starting Chronicle consumer on " + this.wsHost + ":" + this.wsPort
    );
    console.log("Acknowledging every " + this.ackEvery + " blocks");

    if (this.async) {
      this.timer = setInterval(this.async_ack_handler.bind(this), 500);
    }
    this.server = new WebSocket.Server({
      host: this.wsHost,
      port: this.wsPort,
    });
    this.server.on("connection", this._onConnection.bind(this));
  }

  stop() {
    this.server.close(0);
    if (this.async && this.timer) {
      clearInterval(this.timer);
    }
  }

  on(eventName, listener) {
    return this.emitter.on(eventName, listener);
  }
  off(eventName, listener) {
    return this.emitter.off(eventName, listener);
  }
  once(eventName, listener) {
    return this.emitter.once(eventName, listener);
  }

  async requestBlocks(start, end) {
    if (!opts.interactive) {
      throw Error("requestBlocks can only be called in interactive mode");
    }

<<<<<<< Updated upstream
        this['kConsumerServerClientConnected'] = true;
        this.chronicleConnection = socket;
        this.emitter.emit('connected', {remoteAddress: socket._socket.remoteAddress,
                                        remoteFamily: socket._socket.remoteFamily,
                                        remotePort: socket._socket.remotePort});
        
        socket.on('close', (code, reason) => {
          console.log('Graceful close of Chronicle connection initiated');
          if (typeof code !== 'undefined') {
            console.log(`Close status code: ${code}`);
          }

          if (typeof reason !== 'undefined') {
            console.log(`Close reason: ${reason}`);
          }

          this.closeHandler(socket);
        });

        socket.on('error', (error) => {
          console.error('Error close of Chronicle connection initiated');

          if (typeof error !== 'undefined') {
            console.log('WebSocket error: ', error);
          }

          this.closeHandler(socket);
=======
    if (start > end) {
      throw Error("start block should not be lower than end");
    }

    this.chronicleConnection.send(start.toString(10) + "-" + end.toString(10));
  }

  closeHandler(socket, emitDisconnect = true) {
    try {
      socket.close();
    } catch (err) {
      console.error("Graceful close of websocket threw error", err);
    } finally {
      if (emitDisconnect) {
        this["kConsumerServerClientConnected"] = false;
        this.emitter.emit("disconnected", {
          remoteAddress: socket._socket.remoteAddress,
          remoteFamily: socket._socket.remoteFamily,
          remotePort: socket._socket.remotePort,
>>>>>>> Stashed changes
        });
      }
    }
  }

  _onConnection(socket) {
    if (this["kConsumerServerClientConnected"]) {
      console.error(
        "Rejected a new Chronicle connection because one is active already"
      );
      return this.closeHandler(socket, false);
    }

    this["kConsumerServerClientConnected"] = true;
    this.chronicleConnection = socket;
    this.emitter.emit("connected", {
      remoteAddress: socket._socket.remoteAddress,
      remoteFamily: socket._socket.remoteFamily,
      remotePort: socket._socket.remotePort,
    });

    socket.on("close", (code, reason) => {
      console.log("Graceful close of Chronicle connection initiated");

      if (typeof code !== 'undefined') {
        console.log("Websocket close status code: ", code);
      }

      if (typeof reason !== 'undefined') {
        console.log("Websocket close reason: ", reason);
      }
      this.closeHandler(socket);
    });

    socket.on("error", (error) => {
      console.error("Error close of Chronicle connection initiated");

      if (typeof error !== 'undefined') {
        console.error("Websocket error: ", error);
      }
      this.closeHandler(socket);
    });

    socket.on(
      "message",
      function (data) {
        let msgType = data.readInt32LE(0);
        let msg = JSON.parse(data.toString("utf8"));

        let event = this.typemap.get(msgType);
        if (!event) {
          throw Error("Unknown msgType: " + msgType);
        }

        let res = this.emitter.emit(event, msg);

        let block_num;
        let do_ack = false;
        switch (msgType) {
          case 1010 /* BLOCK_COMPLETED */:
            block_num = msg["block_num"];
            this.unconfirmed_block = block_num;
            if (
              this.unconfirmed_block - this.confirmed_block >=
              this.ackEvery
            ) {
              this.confirmed_block = block_num;
              do_ack = true;
            }
            break;

          case 1001 /* FORK */:
            block_num = msg["block_num"];
            this.confirmed_block = block_num - 1;
            this.unconfirmed_block = block_num - 1;
            do_ack = true;
            break;

          case 1009 /* RCVR_PAUSE */:
            if (this.unconfirmed_block > this.confirmed_block) {
              this.confirmed_block = this.unconfirmed_block;
              do_ack = true;
            }
            break;
        }

        if (do_ack) {
          if (this.async) {
            this.pendingAcks.push(this.confirmed_block);
            this.pendingAck = this.pendingAck.then(
              this._async_ack(this.confirmed_block)
            );
          } else {
            this._sync_ack(this.confirmed_block);
          }
        }
      }.bind(this)
    );
  }

  handle_ack(block_number) {
    if (!this.interactive) {
      if (this.async) {
        this.pendingAcks.push(block_number);
      } else {
          // tell the library consumer to handle this block
          this.emitter.emit("ackBlock", ack_block_number);
          // call the library consumer
          this.blockHandler(ack_block_number)
          this.chronicleConnection.send(ack_block_number.toString(10));
      }
    }
  }

  async_ack_handler() {
    try {
      if (!this.interactive) {
        this.processingAcks = true;
        while (this.pendingAcks.length > 0) {
          // push/shift creates a FIFO queue
          const block_number = this.pendingAcks.shift();
          // tell the library consumer to handle this block
          this.emitter.emit("ackBlock", block_number);
          // call the library consumer
          this.blockHandler(block_number)
          // tell Chronicle that we've handled this block
          this.chronicleConnection.send(block_number.toString(10));
        }
      }
    } catch (err) {
      console.error("Caught error processing acks:", err);
    } finally {
      this.processingAcks = false;
    }
  }
}

module.exports = ConsumerServer;
