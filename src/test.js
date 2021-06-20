"use strict";

import ChronicleConsumer from "./index.js";

const port = 8899;

async function testConsumer(port) {
  const server = new ChronicleConsumer({ port });

  server.on("fork", function (data) {
    let block_num = data["block_num"];
    console.log("fork: " + block_num);
  });

  server.on("tx", function (data) {
    let trace = data.trace;
    if (trace.status == "executed") {
      for (let i = 0; i < trace.action_traces.length; i++) {
        let atrace = trace.action_traces[i];
        if (atrace.receipt.receiver == atrace.act.account) {
          if (atrace.act.name == "transfer") {
            let d = atrace.act.data;
            console.log(`${atrace.act.account} ${d.from} -> ${d.to} qty: ${d.quantity}`);
          }
        }
      }
    }
  });

  server.start();
}

testConsumer(port);