for (let i = 0; i < 13; i++) {
  const dupThing = document.querySelector(".views").cloneNode(true);
  document.querySelector(".container").appendChild(dupThing);
}

const elems2 = document.querySelectorAll(".views");
let x = 0, y = 0, angle = 0;
for (let i = 0; i < elems2.length; i++) {
  const elem = elems2[i];
  x = 184 * Math.cos(angle) + 190;
  y = 184 * Math.sin(angle) + 190;
  elem.style.position = 'absolute';
  elem.style.left = x + 'px';
  elem.style.top = y + 'px';
  const rot = 0 + (i * (360 / elems2.length));
  elem.style.transform = "rotate(" + rot + "deg)";
  angle += Math.PI * 2 / elems2.length;
}

const nextClick = document.querySelector('#nextClick');
const container = document.querySelector('.container');
let count = 0;
const degCalc = 360 / elems2.length;
nextClick.addEventListener('click', function () {
  count++;
  let deg = count * degCalc;
  container.style.transform = "rotate(" + deg + "deg)";
});

const saveReelBtn = document.querySelector('#saveReel');
saveReelBtn.addEventListener('click', function () {
  fetch('localhost:8080/save-reel', {
    method: 'POST'
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to save reel: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      console.log('Reel saved:', data);
      alert('Reel saved! UUID: ' + data.uuid);
    })
    .catch(error => {
      console.error('Failed to save reel:', error);
      alert('Failed to save reel. Please try again.');
    });
});

