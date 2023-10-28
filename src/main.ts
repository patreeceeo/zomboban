
interface HMRData {
}

if (module.hot) {
  module.hot.dispose((data: HMRData) => {
  });
  module.hot.accept(() => {
  });

  setTimeout(() => {
  }, 0);
} else {
}

const ws = new WebSocket("ws://localhost:2345");
ws.onmessage = async (event) => {
  console.log("received message", event.data);
  const message = JSON.parse(event.data);
};

