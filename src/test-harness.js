'use strict';

import WebSocket from 'ws';

// this is a test harness designed to test (and load-test) Chronicle consumers by
// throwing as many fake "blocks" at them as possible. The blocks being sent are
// garbage, but the communication format follows the layout expected by Chronicle
// consumers, so as long as the blocks are not parsed deeper than the top-level
// protocol (the "envelope"), this should work. Work for the future should include
// some actual live-ish looking blocks.

const consumerAddress = 'ws://localhost:8899';

function bufferFrom(msgType, opts, obj) {
  const header = Buffer.alloc(8);
  header.writeInt32LE(msgType, 0);
  header.writeInt32LE(opts, 4);

  const json = Buffer.from(JSON.stringify(obj), 'utf-8');

  return Buffer.concat([ header, json ])
}

function createTx(blockNum, trace) {
  const payload = {
    block_num: blockNum,
    trace
  };

  return bufferFrom(1003, 0, payload);
}

function testHarness(consumerAddress, delay = 1000) {
  const ws = new WebSocket(consumerAddress);
  let timer;
  let blockNum = 100;
  const account = 12345;

  ws.on('open', function open() {
    ws.send(bufferFrom(1001, 0, { block_num: blockNum, }));

    timer = setInterval(() => {
      const trace = {
        status: 'executed',
        id: 12455,
        action_traces: [
          {
            act: {
              account,
              name: 'transfer',
              data: {
                from: 'foo',
                to: 'bar',
                quantity: 1999,
              }
            },
            receipt: {
              receiver: account,
            }
          }
        ]
      };

      ws.send(createTx(++blockNum, trace));
    }, delay);
  });
  
  ws.on('close', (reason) => {
    console.log('WebSocket closed, reason:', reason);
    
    if (timer) {
      clearInterval(timer);
    }
    
    process.exit(0);
  });
}

testHarness(consumerAddress, 100)